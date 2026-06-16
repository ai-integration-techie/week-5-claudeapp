import { NextResponse } from 'next/server'
import { getDashboardKpis, getSessions } from '@/lib/db'
import { getRequestUserId } from '@/lib/api-auth'

// GET /api/dashboard — KPIs + recent sessions for the dashboard.
export async function GET(request: Request) {
  const userId = getRequestUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }
  try {
    const [kpis, sessions] = await Promise.all([
      getDashboardKpis(userId),
      getSessions(userId),
    ])
    return NextResponse.json({ kpis, recentSessions: sessions.slice(0, 5) })
  } catch (err) {
    console.error('dashboard error:', err)
    return NextResponse.json({ error: 'Could not load dashboard.' }, { status: 500 })
  }
}
