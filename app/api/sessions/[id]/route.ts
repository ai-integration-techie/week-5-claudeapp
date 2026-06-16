import { NextResponse } from 'next/server'
import { updateSession, deleteSession } from '@/lib/db'
import { getRequestUserId } from '@/lib/api-auth'
import type { SessionStatus } from '@/lib/types'

// PATCH /api/sessions/[id] — rename, pin/unpin, or set status (FR-023/024)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getRequestUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }
  const { id } = await params

  let body: { title?: string; pinned?: boolean; status?: SessionStatus }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const fields: { title?: string; pinned?: boolean; status?: SessionStatus } = {}
  if (typeof body.title === 'string') {
    const title = body.title.trim()
    if (!title) {
      return NextResponse.json({ error: 'Title cannot be empty.' }, { status: 400 })
    }
    fields.title = title.slice(0, 200)
  }
  if (typeof body.pinned === 'boolean') fields.pinned = body.pinned
  if (body.status) fields.status = body.status

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  try {
    const session = await updateSession(id, userId, fields)
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
    }
    return NextResponse.json({ session })
  } catch (err) {
    console.error('patch session error:', err)
    return NextResponse.json({ error: 'Could not update session.' }, { status: 500 })
  }
}

// DELETE /api/sessions/[id] — cascade deletes messages + feedback (FR-025)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getRequestUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }
  const { id } = await params
  try {
    const ok = await deleteSession(id, userId)
    if (!ok) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('delete session error:', err)
    return NextResponse.json({ error: 'Could not delete session.' }, { status: 500 })
  }
}
