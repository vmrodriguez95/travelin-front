import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
// Vite resolves this to a hashed asset URL for the pdf.js worker.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

// Extracts the plain text content of every page of a PDF file.
export async function extractPdfText(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = getDocument({ data })
  const pdf = await loadingTask.promise

  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber)
    const textContent = await page.getTextContent()

    const text = textContent.items
      .map((item) => (item as { str?: string }).str ?? '')
      .join(' ')

    pages.push(text)
  }

  await loadingTask.destroy()

  return pages.join('\n\n').replace(/\s+\n/g, '\n').trim()
}
