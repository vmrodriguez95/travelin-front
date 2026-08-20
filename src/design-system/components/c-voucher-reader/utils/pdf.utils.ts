// Utils
import { renderPages } from '@ds/components/c-voucher-reader/utils/pdf-field.utils'

// Types
import type { PdfPage, PdfTextCell } from '../types/pdf.types'

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null

// Pulls in pdf.js on first use only, so the .pkpass path never pays for it.
function loadPdfjs(): Promise<typeof import('pdfjs-dist')> {
  pdfjsPromise ??= (async () => {
    const [pdfjs, { default: PdfWorker }] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?worker')
    ])

    // Hand pdf.js a worker we instantiate ourselves. Going through workerPort
    // keeps the worker a separate file: the workerSrc route makes Vite treat it
    // as an asset, and library builds inline every asset as a base64 data URL.
    pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker()

    return pdfjs
  })()

  return pdfjsPromise
}

// Reads every page as positioned text cells. Keeping the coordinates (rather
// than flattening to a string here) is what lets a vendor profile crop a page
// down to one block before reading it.
export async function extractPdfPages(file: File): Promise<PdfPage[]> {
  const { getDocument } = await loadPdfjs()

  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = getDocument({ data })
  const pdf = await loadingTask.promise

  const pages: PdfPage[] = []

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber)
      const textContent = await page.getTextContent()
      const { width, height } = page.getViewport({ scale: 1 })

      // Whitespace-only items are dropped: pdf.js emits them to span the gap
      // between two columns, and keeping them would hide that gap behind a
      // zero-width join. Once they are gone the coordinates tell the whole story.
      const cells = textContent.items.flatMap<PdfTextCell>((item) =>
        'str' in item && item.str.trim()
          ? [{ x: item.transform[4], y: item.transform[5], width: item.width, text: item.str }]
          : []
      )

      pages.push({ width, height, cells })
    }
  } finally {
    // Always release the worker, even if a page fails to parse.
    await loadingTask.destroy()
  }

  return pages
}

// Flat text of the whole document, preserving line and column structure.
export async function extractPdfText(file: File): Promise<string> {
  return renderPages(await extractPdfPages(file))
}
