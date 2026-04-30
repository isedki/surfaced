import { db } from '@/lib/db'
import { integrations, activities } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { startOfDay, endOfDay, subDays } from 'date-fns'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const CALENDAR_API     = 'https://www.googleapis.com/calendar/v3'

export function getGoogleAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
    response_type: 'code',
    scope:         'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email',
    access_type:   'offline',
    prompt:        'consent',
    state:         userId,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeGoogleCode(code: string): Promise<{
  access_token: string; refresh_token?: string; expires_in: number
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
      grant_type:    'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`)
  return res.json()
}

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type:    'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`)
  return res.json()
}

async function getValidToken(userId: string): Promise<string | null> {
  const [integration] = await db.select()
    .from(integrations)
    .where(and(eq(integrations.userId, userId), eq(integrations.provider, 'google')))
    .limit(1)

  if (!integration) return null

  // Refresh if expired
  if (integration.expiresAt && integration.expiresAt < new Date() && integration.refreshToken) {
    const refreshed = await refreshGoogleToken(integration.refreshToken)
    const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000)
    await db.update(integrations)
      .set({ accessToken: refreshed.access_token, expiresAt, updatedAt: new Date() })
      .where(eq(integrations.id, integration.id))
    return refreshed.access_token
  }

  return integration.accessToken
}

export async function syncCalendarEvents(userId: string, daysBack = 1): Promise<number> {
  const token = await getValidToken(userId)
  if (!token) return 0

  const timeMin = startOfDay(subDays(new Date(), daysBack)).toISOString()
  const timeMax = endOfDay(new Date()).toISOString()

  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return 0

  const data = await res.json()
  const events: any[] = data.items ?? []

  let synced = 0
  for (const event of events) {
    if (!event.summary || event.status === 'cancelled') continue

    const participants = (event.attendees ?? [])
      .filter((a: any) => !a.self)
      .map((a: any) => ({ name: a.displayName ?? a.email, email: a.email }))

    const date = new Date(event.start?.dateTime ?? event.start?.date)

    // Upsert: skip if already stored
    const existing = await db.select().from(activities)
      .where(and(eq(activities.userId, userId), eq(activities.externalId, event.id)))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(activities).values({
        userId,
        source:       'google_calendar',
        externalId:   event.id,
        type:         participants.length > 0 ? 'meeting' : 'block',
        title:        event.summary,
        description:  event.description ?? null,
        participants,
        date,
        rawData:      event,
      })
      synced++
    }
  }
  return synced
}
