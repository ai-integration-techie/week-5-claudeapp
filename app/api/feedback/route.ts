import { NextResponse } from 'next/server'
import { getSession, createFeedback } from '@/lib/db'
import { getRequestUserId } from '@/lib/api-auth'

// POST /api/feedback — save a rating for an assistant message (FR-020)
export async function POST(request: Request) {
  const userId = getRequestUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  let body: {
    sessionId?: string
    messageId?: string
    rating?: number
    comment?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { sessionId, messageId, rating, comment } = body
  if (!sessionId || !messageId || typeof rating !== 'number') {
    return NextResponse.json(
      { error: 'sessionId, messageId and rating are required.' },
      { status: 400 }
    )
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5.' }, { status: 400 })
  }

  // Ownership check via the parent session
  const session = await getSession(sessionId, userId)
  if (!session) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
  }

  try {
    const feedback = await createFeedback({
      userId,
      sessionId,
      messageId,
      rating,
      comment: comment?.trim() || null,
    })
    return NextResponse.json({ feedback }, { status: 201 })
  } catch (err) {
    console.error('feedback error:', err)
    return NextResponse.json({ error: 'Could not save feedback.' }, { status: 500 })
  }
}
