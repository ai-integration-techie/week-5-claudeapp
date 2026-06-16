'use client'

import { getUserId } from './session'

// Client fetch wrapper that injects the x-user-id header from localStorage.
export async function apiFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const userId = getUserId()
  const headers = new Headers(init.headers)
  if (userId) headers.set('x-user-id', userId)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(input, { ...init, headers })
}
