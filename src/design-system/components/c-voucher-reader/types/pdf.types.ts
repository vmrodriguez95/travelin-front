// Intermediate shapes used to rebuild the visual layout of a page.
// pdf.js hands back text items in drawing order, with no line breaks and no
// grouping, so we re-derive rows and columns from their coordinates.

export interface PdfTextCell {
  // Left edge of the item, in PDF user-space units.
  x: number
  // Baseline of the item. PDF user space has its origin at the bottom-left,
  // so higher values sit closer to the top of the page.
  y: number
  // Advance width of the item, used to measure the gap to the next cell.
  width: number
  text: string
}

export interface PdfTextRow {
  // Baseline shared by every cell in the row, within ROW_TOLERANCE.
  y: number
  cells: PdfTextCell[]
}

export interface PdfPage {
  // Page box, needed to turn a profile's fractional crop into user-space units.
  width: number
  height: number
  cells: PdfTextCell[]
}

// A crop expressed as fractions of the page box (0 = left/top, 1 = right/bottom),
// so a profile keeps working across A4, Letter and any other page size.
export interface PdfCropBox {
  // Zero-based page index. Defaults to the first page.
  page?: number
  xMin?: number
  xMax?: number
  yMin?: number
  yMax?: number
}
