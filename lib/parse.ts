'use client'

// Client-side document parsing. Raw files never leave the browser — only the
// extracted text is sent to the backend (rules: parse client-side).

export const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB
export const ACCEPTED_EXT = ['.pdf', '.docx']

export interface ParsedDocument {
  text: string
  filename: string
  previewUrl: string // blob URL for PDF preview; '' for DOCX
  fileType: string // MIME type
}

export class ParseError extends Error {}

function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i === -1 ? '' : name.slice(i).toLowerCase()
}

export function validateFile(file: File): string | null {
  const ext = extOf(file.name)
  if (!ACCEPTED_EXT.includes(ext)) {
    return 'Unsupported file type. Upload a PDF or DOCX.'
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'File is too large. Maximum size is 10MB.'
  }
  return null
}

async function parsePdf(file: File): Promise<{ text: string; previewUrl: string }> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  const buffer = await file.arrayBuffer()
  const previewUrl = URL.createObjectURL(file)

  const doc = await pdfjs.getDocument({ data: buffer }).promise
  let text = ''
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const strings = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    text += strings + '\n'
  }

  // Scanned-PDF detection (FR-010): almost no extractable text
  if (text.replace(/\s/g, '').length < 20) {
    URL.revokeObjectURL(previewUrl)
    throw new ParseError(
      'This looks like a scanned PDF with no selectable text. Upload a text-based PDF.'
    )
  }

  return { text: text.trim(), previewUrl }
}

async function parseDocx(file: File): Promise<{ text: string; previewUrl: string }> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const text = (result.value ?? '').trim()
  if (text.length < 1) {
    throw new ParseError('No readable text found in this document.')
  }
  return { text, previewUrl: '' }
}

export async function parseFile(file: File): Promise<ParsedDocument> {
  const validationError = validateFile(file)
  if (validationError) throw new ParseError(validationError)

  const ext = extOf(file.name)
  if (ext === '.pdf') {
    const { text, previewUrl } = await parsePdf(file)
    return { text, filename: file.name, previewUrl, fileType: 'application/pdf' }
  }
  const { text, previewUrl } = await parseDocx(file)
  return {
    text,
    filename: file.name,
    previewUrl,
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }
}
