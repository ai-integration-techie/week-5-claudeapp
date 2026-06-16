// Database row types — mirror supabase/schema.sql

export type SessionStatus = 'idle' | 'processing' | 'completed' | 'error'
export type MessageRole = 'user' | 'assistant'

export interface User {
  id: string
  email: string
  password_hash: string
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  title: string
  status: SessionStatus
  pinned: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  session_id: string
  role: MessageRole
  content: string
  created_at: string
}

export interface Feedback {
  id: string
  user_id: string
  session_id: string
  message_id: string
  rating: number
  comment: string | null
  created_at: string
}

// Aggregate KPI shape returned to the dashboard
export interface DashboardKpis {
  totalDocuments: number
  documentsToday: number
  totalQueries: number
  queriesThisWeek: number
  activeSessions: number
  pinnedChats: number
  avgRating: number | null
  failedJobs: number
}
