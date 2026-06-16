'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserId } from './session'

// FR-004: redirect to /login if no userId in localStorage.
// Returns the userId once confirmed, or null while checking/redirecting.
export function useAuthGuard(): string | null {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const id = getUserId()
    if (!id) {
      router.replace('/login')
      return
    }
    setUserId(id)
  }, [router])

  return userId
}
