// Runs a vendor profile against a real PDF and prints what it extracts.
//
//   node verify.mjs <pdf> <profile.json>
//
// The interpreter is bundled from src/ on every run, so this can never drift
// from what the browser actually does. A profile that has not been through
// this has not been tested.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')

const [file, profilePath] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
if (!file || !profilePath) {
  console.error('uso: node verify.mjs <pdf> <profile.json>')
  process.exit(1)
}

const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'))

// --- bundle the real interpreter ---------------------------------------------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-profile-'))
const entry = path.join(tmp, 'entry.ts')
const bundle = path.join(tmp, 'ds.mjs')

fs.writeFileSync(entry, `
export { parseWithPdfProfile, detectProfileId } from '@ds/components/c-voucher-reader/utils/pdf-profile.utils'
export { parseGenericPdf, sanitizeDraft } from '@ds/components/c-voucher-reader/utils/pdf-generic.utils'
export { renderPages } from '@ds/components/c-voucher-reader/utils/pdf-field.utils'
`)

execFileSync(path.join(ROOT, 'node_modules/.bin/esbuild'), [
  entry, '--bundle', '--format=esm', '--platform=node',
  `--alias:@ds=${path.join(ROOT, 'src/design-system')}`,
  `--outfile=${bundle}`, '--log-level=error'
], { stdio: 'inherit' })

const { parseWithPdfProfile, detectProfileId, parseGenericPdf, sanitizeDraft, renderPages } =
  await import(bundle)

// --- read the PDF (the real extractPdfPages needs a browser worker) ----------
const pdfjs = await import(`${ROOT}/node_modules/pdfjs-dist/legacy/build/pdf.mjs`)
pdfjs.GlobalWorkerOptions.workerSrc = `${ROOT}/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs`

const task = pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)) })
const doc = await task.promise
const pages = []

for (let n = 1; n <= doc.numPages; n++) {
  const page = await doc.getPage(n)
  const content = await page.getTextContent()
  const { width, height } = page.getViewport({ scale: 1 })
  pages.push({
    width, height,
    cells: content.items.flatMap((item) =>
      'str' in item && item.str.trim()
        ? [{ x: item.transform[4], y: item.transform[5], width: item.width, text: item.str }]
        : [])
  })
}
await task.destroy()

const text = renderPages(pages)

// --- report ------------------------------------------------------------------
const detected = detectProfileId(text, [{ id: profile.id, match: profile.match }])
console.log(`\nperfil        ${profile.id}  (${profile.poiType})`)
console.log(`match         ${JSON.stringify(profile.match)}`)
console.log(detected === profile.id
  ? `detección     OK — la huella aparece en el documento`
  : `detección     FALLA — ninguna cadena de "match" aparece en el texto`)

const withProfile = sanitizeDraft(parseWithPdfProfile(pages, text, profile))
const generic = sanitizeDraft(parseGenericPdf(pages, text, profile.poiType))

const flat = (draft, prefix = '') => Object.entries(draft).flatMap(([key, value]) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? flat(value, `${prefix}${key}.`)
    : [[`${prefix}${key}`, Array.isArray(value) ? JSON.stringify(value) : String(value ?? '')]])

const skip = new Set(['type', 'icon', 'types'])
const rows = flat(withProfile).filter(([k]) => !skip.has(k))
const genericMap = Object.fromEntries(flat(generic))

console.log('\n  campo                 perfil                                    genérico')
console.log('  ' + '-'.repeat(84))
for (const [key, value] of rows) {
  const mine = value === '' || value === '0' ? '· vacío' : value.slice(0, 40)
  const theirs = (genericMap[key] ?? '') === '' || genericMap[key] === '0' ? '· vacío' : String(genericMap[key]).slice(0, 24)
  console.log(`  ${key.padEnd(21)} ${mine.padEnd(41)} ${theirs}`)
}

const empty = rows.filter(([, v]) => v === '' || v === '0').map(([k]) => k)
console.log(empty.length
  ? `\n  ${empty.length} campo(s) sin valor: ${empty.join(', ')}`
  : '\n  todos los campos resueltos')
console.log('\n  Un campo vacío es correcto si el PDF no trae ese dato.')
console.log('  Comprueba a ojo que cada valor es el que pone el documento: un dato')
console.log('  plausible pero equivocado es peor que un hueco.\n')

fs.rmSync(tmp, { recursive: true, force: true })
