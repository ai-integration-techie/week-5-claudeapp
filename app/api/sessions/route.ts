import { NextResponse } from 'next/server'
import { getSessions, createSession } from '@/lib/db'
import { getRequestUserId } from '@/lib/api-auth'

// GET /api/sessions — list the user's sessions (pinned first, recent first)
export async function GET(request: Request) {
  const userId = getRequestUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }
  try {
    const sessions = await getSessions(userId)
    return NextResponse.json({ sessions })
  } catch (err) {
    console.error('list sessions error:', err)
    return NextResponse.json({ error: 'Could not load sessions.' }, { status: 500 })
  }
}

// POST /api/sessions — create a new session, return it
export async function POST(request: Request) {
  const userId = getRequestUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }
  try {
    const session = await createSession(userId)
    return NextResponse.json({ session }, { status: 201 })
  } catch (err) {
    console.error('create session error:', err)
    return NextResponse.json({ error: 'Could not create session.' }, { status: 500 })
  }
}
