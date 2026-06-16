import { NextResponse } from 'next/server'
import { getUser, createUser } from '@/lib/db'
import { isValidEmail, validatePassword, hashPassword } from '@/lib/auth'

export async function POST(request: Request) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const password = body.password ?? ''

  // Validate at the boundary
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  const pwError = validatePassword(password)
  if (pwError) {
    return NextResponse.json({ error: pwError }, { status: 400 })
  }

  try {
    const existing = await getUser(email)
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)
    const user = await createUser(email, passwordHash)

    return NextResponse.json({ userId: user.id, email: user.email }, { status: 201 })
  } catch (err) {
    console.error('signup error:', err)
    return NextResponse.json(
      { error: 'Could not create your account. Please try again.' },
      { status: 500 }
    )
  }
}
