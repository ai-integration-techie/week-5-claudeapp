'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { setSession, getUserId } from '@/lib/session'

type Mode = 'login' | 'signup'

const COPY: Record<
  Mode,
  { title: string; cta: string; endpoint: string; alt: string; altHref: string; altLabel: string }
> = {
  login: {
    title: 'Log in',
    cta: 'Log in',
    endpoint: '/api/auth/login',
    alt: "Don't have an account?",
    altHref: '/signup',
    altLabel: 'Sign up',
  },
  signup: {
    title: 'Create your account',
    cta: 'Sign up',
    endpoint: '/api/auth/signup',
    alt: 'Already have an account?',
    altHref: '/login',
    altLabel: 'Log in',
  },
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const copy = COPY[mode]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // If already logged in, skip auth pages.
  useEffect(() => {
    if (getUserId()) router.replace('/dashboard')
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(copy.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      setSession(data.userId, data.email)
      router.replace('/dashboard')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      data-theme="light"
      className="min-h-screen flex items-center justify-center bg-an-bg-base px-6"
    >
      <div className="w-full max-w-[400px] an-fade-in">
        <Link
          href="/"
          className="text-body-sm text-an-fg-subtle hover:text-an-fg-base transition"
        >
          ← Contract Review
        </Link>
        <h1 className="font-display text-display text-an-fg-base mt-6 mb-6">
          {copy.title}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-label text-an-fg-subtle">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 px-3 rounded-md bg-an-bg-surface border border-an-border text-body text-an-fg-base placeholder:text-an-fg-muted outline-none focus:border-an-border-strong transition"
              placeholder="you@company.com"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-label text-an-fg-subtle">Password</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 px-3 rounded-md bg-an-bg-surface border border-an-border text-body text-an-fg-base placeholder:text-an-fg-muted outline-none focus:border-an-border-strong transition"
              placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
            />
          </label>

          {error && (
            <p className="text-body-sm text-an-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-9 mt-2 rounded-md bg-an-accent text-white text-body font-medium transition duration-150 ease-out hover:bg-an-accent-hover disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait…' : copy.cta}
          </button>
        </form>

        <p className="text-body-sm text-an-fg-subtle mt-6 text-center">
          {copy.alt}{' '}
          <Link href={copy.altHref} className="text-an-accent hover:underline">
            {copy.altLabel}
          </Link>
        </p>
      </div>
    </div>
  )
}
