// Server-side: extract the acting userId from a request.
// Custom auth (localStorage) means the client sends its userId via header.
// NOTE: this trusts the client-provided id — acceptable for the MVP's
// localStorage auth model. Harden with signed tokens before production.
export function getRequestUserId(request: Request): string | null {
  const headerId = request.headers.get('x-user-id')
  if (headerId && headerId.trim()) return headerId.trim()
  return null
}
