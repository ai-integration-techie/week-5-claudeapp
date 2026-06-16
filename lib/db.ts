import 'server-only'
import { supabaseAdmin } from './supabase-server'
import type {
  User,
  Session,
  Message,
  Feedback,
  SessionStatus,
  MessageRole,
  DashboardKpis,
} from './types'

// ===================== Users =====================

export async function getUser(email: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .ilike('email', email)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createUser(
  email: string,
  passwordHash: string
): Promise<User> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({ email: email.toLowerCase(), password_hash: passwordHash })
    .select('*')
    .single()
  if (error) throw error
  return data
}

// ===================== Sessions =====================

export async function createSession(
  userId: string,
  title = 'New session'
): Promise<Session> {
  const { data, error } = await supabaseAdmin
    .from('sessions')
    .insert({ user_id: userId, title })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function getSessions(userId: string): Promise<Session[]> {
  const { data, error } = await supabaseAdmin
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// Ownership-checked single session fetch
export async function getSession(
  sessionId: string,
  userId: string
): Promise<Session | null> {
  const { data, error } = await supabaseAdmin
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateSession(
  sessionId: string,
  userId: string,
  fields: Partial<Pick<Session, 'title' | 'pinned' | 'status'>>
): Promise<Session | null> {
  const { data, error } = await supabaseAdmin
    .from('sessions')
    .update(fields)
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function deleteSession(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const { error, count } = await supabaseAdmin
    .from('sessions')
    .delete({ count: 'exact' })
    .eq('id', sessionId)
    .eq('user_id', userId)
  if (error) throw error
  return (count ?? 0) > 0
}

// ===================== Messages =====================

export async function createMessage(
  sessionId: string,
  role: MessageRole,
  content: string
): Promise<Message> {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({ session_id: sessionId, role, content })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function getMessages(
  sessionId: string,
  limit = 200
): Promise<Message[]> {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

// ===================== Feedback =====================

export async function createFeedback(input: {
  userId: string
  sessionId: string
  messageId: string
  rating: number
  comment?: string | null
}): Promise<Feedback> {
  const { data, error } = await supabaseAdmin
    .from('feedback')
    .upsert(
      {
        user_id: input.userId,
        session_id: input.sessionId,
        message_id: input.messageId,
        rating: input.rating,
        comment: input.comment ?? null,
      },
      { onConflict: 'user_id,message_id' }
    )
    .select('*')
    .single()
  if (error) throw error
  return data
}

// ===================== Dashboard KPIs =====================
// Derived on read (no analytics table — see plan D/§9).

export async function getDashboardKpis(
  userId: string
): Promise<DashboardKpis> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const sessions = await getSessions(userId)
  const sessionIds = sessions.map((s) => s.id)

  // Count user-role messages (queries) for this user's sessions.
  const queryFilter =
    sessionIds.length > 0
      ? supabaseAdmin
          .from('messages')
          .select('id, created_at', { count: 'exact', head: false })
          .in('session_id', sessionIds)
          .eq('role', 'user')
      : null

  const [{ data: ratingRows }, queriesRes] = await Promise.all([
    supabaseAdmin.from('feedback').select('rating').eq('user_id', userId),
    queryFilter ? queryFilter : Promise.resolve({ data: [], count: 0 }),
  ])

  const queryRows = (queriesRes.data ?? []) as { created_at: string }[]
  const ratings = (ratingRows ?? []) as { rating: number }[]

  const avgRating =
    ratings.length > 0
      ? ratings.reduce((a, r) => a + r.rating, 0) / ratings.length
      : null

  return {
    // "documents" tracked as sessions in MVP (one contract per session)
    totalDocuments: sessions.length,
    documentsToday: sessions.filter((s) => s.created_at >= dayAgo).length,
    totalQueries: queryRows.length,
    queriesThisWeek: queryRows.filter((m) => m.created_at >= weekAgo).length,
    activeSessions: sessions.filter((s) => s.updated_at >= weekAgo).length,
    pinnedChats: sessions.filter((s) => s.pinned).length,
    avgRating,
    failedJobs: sessions.filter((s) => s.status === 'error').length,
  }
}
