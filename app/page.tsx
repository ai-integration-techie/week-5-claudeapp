'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // FR-001: redirect to dashboard if already logged in
    if (typeof window !== 'undefined' && localStorage.getItem('userId')) {
      router.replace('/dashboard')
    }
  }, [router])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <span className="text-label uppercase tracking-wide text-an-accent mb-4">
        AI contract review
      </span>
      <h1 className="font-display text-[44px] leading-[1.15] max-w-[640px] mb-5">
        Understand any contract in minutes, not hours
      </h1>
      <p className="text-body text-an-fg-subtle max-w-[520px] mb-8">
        Upload a PDF or DOCX, ask a question, and get grounded answers with
        the exact clauses cited. Built for the details you can&apos;t afford to
        miss.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/signup"
          className="h-9 px-4 inline-flex items-center rounded-md bg-an-accent text-white text-body font-medium transition duration-150 ease-out hover:bg-an-accent-hover"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="h-9 px-4 inline-flex items-center rounded-md border border-an-border text-an-fg-base text-body transition duration-150 ease-out hover:bg-an-bg-surface"
        >
          Log in
        </Link>
      </div>
      <p className="text-caption text-an-fg-muted mt-10 max-w-[460px]">
        AI-generated analysis only. Always consult a qualified professional
        before acting on the findings.
      </p>
    </main>
  )
}
