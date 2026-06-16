'use client'

// Client-side session helpers. The app uses localStorage (per project rules),
// not Supabase Auth. Call these only in the browser.

const USER_ID_KEY = 'userId'
const USER_EMAIL_KEY = 'userEmail'

export function setSession(userId: string, email: string): void {
  localStorage.setItem(USER_ID_KEY, userId)
  localStorage.setItem(USER_EMAIL_KEY, email)
}

export function getUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(USER_ID_KEY)
}

export function getUserEmail(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(USER_EMAIL_KEY)
}

export function clearSession(): void {
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(USER_EMAIL_KEY)
}
