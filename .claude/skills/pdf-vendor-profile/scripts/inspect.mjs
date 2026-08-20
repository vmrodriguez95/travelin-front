// Dumps the text layout of a PDF the way the voucher reader sees it, so a
// vendor profile can be written against real coordinates instead of guesses.
//
//   node inspect.mjs <pdf> [--page N] [--crop xMin,xMax,yMin,yMax] [--mask]
//
// --crop takes the same fractional box a profile's `within` uses, so you can
// preview exactly what an accessor will be able to read before writing it.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith('--'))
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
  ?? (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined)

if (!file) {
  console.error('uso: node inspect.mjs <pdf> [--page N] [--crop xMin,xMax,yMin,yMax] [--mask]')
  process.exit(1)
}

const onlyPage = flag('page') ? Number(flag('page')) : null
const crop = flag('crop')?.split(',').map(Number)
const mask = args.includes('--mask')

// Same constants as pdf-field.utils.ts. Keep them in sync if that file changes.
const ROW_TOLERANCE = 2
const COLUMN_GAP = 12
const WORD_GAP = 0.9

const pdfjs = await import(`${ROOT}/node_modules/pdfjs-dist/legacy/build/pdf.mjs`)
pdfjs.GlobalWorkerOptions.workerSrc = `${ROOT}/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs`

function toLines(cells) {
  const rows = []
  for (const cell of [...cells].sort((a, b) => b.y - a.y)) {
    const current = rows.at(-1)
    if (current && Math.abs(current.y - cell.y) <= ROW_TOLERANCE) { current.cells.push(cell); continue }
    rows.push({ y: cell.y, cells: [cell] })
  }
  return rows.map((row) => {
    let line = ''
    let previousEnd = null
    for (const cell of [...row.cells].sort((a, b) => a.x - b.x)) {
      if (previousEnd !== null) {
        const gap = cell.x - previousEnd
        line += gap > COLUMN_GAP ? '\t' : (gap > WORD_GAP ? ' ' : '')
      }
      line += cell.text
      previousEnd = cell.x + cell.width
    }
    return line.trimEnd()
  }).filter((line) => line.trim())
}

// Personal data lives in the values, not the labels. This keeps the structure
// readable while making the dump safe to paste into an issue or a chat.
const hide = (s) => mask
  ? s.replace(/[\w.+-]+@[\w.-]+/g, '<email>')
     .replace(/\b\d{6,}\b/g, '<num>')
     .replace(/\+?\d[\d ]{8,}/g, '<tel>')
  : s

const bytes = new Uint8Array(fs.readFileSync(file))
const task = pdfjs.getDocument({ data: bytes })
const doc = await task.promise

for (let n = 1; n <= doc.numPages; n++) {
  if (onlyPage && n !== onlyPage) continue

  const page = await doc.getPage(n)
  const content = await page.getTextContent()
  const { width, height } = page.getViewport({ scale: 1 })

  let cells = content.items.flatMap((item) =>
    'str' in item && item.str.trim()
      ? [{ x: item.transform[4], y: item.transform[5], width: item.width, text: item.str }]
      : [])

  console.log(`\n${'='.repeat(70)}`)
  console.log(`PÁGINA ${n} (índice ${n - 1})   ${width.toFixed(0)} x ${height.toFixed(0)}`)

  if (crop) {
    const [xMin, xMax, yMin, yMax] = crop
    cells = cells.filter((c) => {
      const fromTop = height - c.y
      return c.x >= xMin * width && c.x <= xMax * width
        && fromTop >= yMin * height && fromTop <= yMax * height
    })
    console.log(`RECORTE { xMin: ${xMin}, xMax: ${xMax}, yMin: ${yMin}, yMax: ${yMax} }  ->  ${cells.length} fragmentos`)
  }
  console.log('='.repeat(70))

  const lines = toLines(cells)
  lines.forEach((line, i) => console.log(String(i).padStart(3) + ' │ ' + hide(line).replace(/\t/g, ' ⇥ ')))

  if (crop) continue

  // Side-by-side blocks are the main trap: their rows share no baseline, so a
  // whole-page read interleaves them. A wide horizontal gap is where to cut.
  console.log('\n── huecos horizontales (candidatos a separar columnas) ──')
  const bands = [['cabecera (0–35%)', 0, 0.35], ['centro (35–70%)', 0.35, 0.7], ['pie (70–100%)', 0.7, 1]]

  for (const [label, from, to] of bands) {
    const band = cells.filter((c) => {
      const fromTop = height - c.y
      return fromTop >= from * height && fromTop <= to * height
    })
    if (band.length < 4) { console.log(`  ${label}: pocos fragmentos`); continue }

    const xs = [...new Set(band.map((c) => Math.round(c.x)))].sort((a, b) => a - b)
    let best = { gap: 0, at: 0 }
    for (let i = 1; i < xs.length; i++) {
      const gap = xs[i] - xs[i - 1]
      if (gap > best.gap) best = { gap, at: xs[i - 1] }
    }
    const cut = (best.at + best.gap / 2) / width
    console.log(best.gap > 40
      ? `  ${label}: hueco de ${best.gap.toFixed(0)}u  ->  corta en x ≈ ${cut.toFixed(2)}  (izquierda: xMax ${cut.toFixed(2)} · derecha: xMin ${cut.toFixed(2)})`
      : `  ${label}: sin hueco claro (mayor ${best.gap.toFixed(0)}u) — probablemente una sola columna`)
  }
}

await task.destroy()
