import { NextResponse } from 'next/server'
import { getUser } from '@/lib/db'
import { isValidEmail, comparePassword } from '@/lib/auth'

// Generic error — never reveal whether the email or the password was wrong (FR-003).
const GENERIC_ERROR = 'Invalid email or password.'

export async function POST(request: Request) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const password = body.password ?? ''

  if (!isValidEmail(email) || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
  }

  try {
    const user = await getUser(email)
    if (!user) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
    }

    const ok = await comparePassword(password, user.password_hash)
    if (!ok) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
    }

    return NextResponse.json({ userId: user.id, email: user.email }, { status: 200 })
  } catch (err) {
    console.error('login error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
