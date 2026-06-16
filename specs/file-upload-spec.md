# File Upload Spec — Contract Review

> Source: `blueprint/app-plan.md` Phase 5. Implemented in `lib/parse.ts`,
> `components/chat/FileAttach.tsx`, `components/DocumentPreview.tsx`, and the chat
> page's document state.

## Feature Name
Contract Upload (PDF / DOCX)

## Description
Accepts **`.pdf` and `.docx` only**, ≤ **10MB**. Files are **parsed entirely in the
browser** to plain text; the raw file never leaves the client. Only the extracted
text is sent to the backend (with each chat message). The file is **session-only**
state (component state, not persisted).

## User Flow
1. Click the paperclip (attach) button in the composer.
2. File picker filters to `.pdf,.docx`.
3. On selection: spinner while parsing; on success a **file chip** (filename + ✕)
   appears above the composer and a **preview** renders in the right panel.
4. The extracted text is sent as `contractText` with the next question.
5. Remove via the chip's ✕ (revokes blob URL, clears state). Selecting a new file
   replaces the previous one (old blob URL revoked first).
6. On session switch the document is cleared (FR-029).

## How Content Reaches the Backend
Extracted text is sent as a JSON string field **`contractText`** in the `POST
/api/chat` body. When no file is attached, send is blocked (a contract is required),
so `contractText` is always non-empty at call time.

## Parsing Strategy — Client-side
| Type | Ext / MIME | Library | Method |
|---|---|---|---|
| PDF | `.pdf` / `application/pdf` | `pdfjs-dist` **v6** | `getDocument` → per-page `getTextContent` |
| DOCX | `.docx` / `…wordprocessingml.document` | `mammoth` | `extractRawText({ arrayBuffer })` |

**pdfjs-dist v6 browser setup (implemented):**
- Worker copied to `public/pdf.worker.min.mjs`.
- `GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'`.
- `pdfjs-dist` added to `serverExternalPackages` in `next.config.mjs`.
- `pdfjs-dist` is dynamically `import()`-ed inside the parse function (client only),
  avoiding SSR issues. (Note: this is **v6**, not the v4 in the original template.)

## Content Preview (`components/DocumentPreview.tsx`)
- **PDF**: `<iframe src={blobUrl}>` (blob URL created via `URL.createObjectURL`).
- **DOCX**: extracted text in a scrollable monospace `<pre>`, truncated at **4000
  chars** with "… (preview truncated)".
- Lives in the right panel's Document section; persists while chatting (FR-018).

## State Architecture — CRITICAL
The parent (`app/chat/page.tsx`) owns `doc: ParsedDocument`
(`text`, `filename`, `previewUrl`, `fileType`). `FileAttach` holds **no document
state** — it parses and calls `onFileLoaded(doc)`. Why parent-owned: the composer
(send), right panel (preview), and chip all read it.

Callback: `onFileLoaded(doc)` where `doc = { text, filename, previewUrl, fileType }`.
`previewUrl` is a blob URL for PDFs, `''` for DOCX.

## API Contract
- Field: `contractText` (string) in `POST /api/chat`.
- Capped server-side at ~80k tokens (`MAX_CONTRACT_CHARS = 320_000` chars) in
  `lib/azure.ts`, with a truncation note appended.

## Validation (`lib/parse.ts`)
- Type: extension must be `.pdf`/`.docx` → else "Unsupported file type…".
- Size: > 10MB → "File is too large. Maximum size is 10MB."
- Scanned PDF (FR-010): if stripped text < 20 chars → blocked with "This looks like a
  scanned PDF…".
- Empty DOCX → "No readable text found in this document."
- All raised as `ParseError`; surfaced via the composer's error line; never block
  other app functions.

## Edge Cases
| Case | Handling |
|---|---|
| Remove after attaching | Revoke blob URL, clear all doc state |
| Parse failure | Inline error, app stays usable |
| Content exceeds backend limit | Truncated at 320k chars with note |
| Second file attached | Replaces first; old blob URL revoked |
| Submit without a file | Blocked with inline guidance (contract required) |
| Scanned/empty document | Blocked with specific message |
