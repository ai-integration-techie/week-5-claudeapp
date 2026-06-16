import { NextResponse } from 'next/server'
import { getSession, getMessages, createMessage } from '@/lib/db'
import { getRequestUserId } from '@/lib/api-auth'

// GET /api/messages?sessionId=... — full history for a session (ownership checked)
export async function GET(request: Request) {
  const userId = getRequestUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }
  const sessionId = new URL(request.url).searchParams.get('sessionId')
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required.' }, { status: 400 })
  }
  try {
    const session = await getSession(sessionId, userId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
    }
    const messages = await getMessages(sessionId)
    return NextResponse.json({ messages })
  } catch (err) {
    console.error('get messages error:', err)
    return NextResponse.json({ error: 'Could not load messages.' }, { status: 500 })
  }
}

// POST /api/messages — persist a single message (ownership checked)
export async function POST(request: Request) {
  const userId = getRequestUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }
  let body: { sessionId?: string; role?: 'user' | 'assistant'; content?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  const { sessionId, role, content } = body
  if (!sessionId || !role || !content) {
    return NextResponse.json(
      { error: 'sessionId, role and content are required.' },
      { status: 400 }
    )
  }
  try {
    const session = await getSession(sessionId, userId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
    }
    const message = await createMessage(sessionId, role, content)
    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    console.error('create message error:', err)
    return NextResponse.json({ error: 'Could not save message.' }, { status: 500 })
  }
}
