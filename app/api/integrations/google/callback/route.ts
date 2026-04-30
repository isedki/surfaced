import { NextRequest } from 'next/server'
import { exchangeGoogleCode } from '@/lib/integrations/google-calendar'
import { db } from '@/lib/db'
import { integrations } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export async function GET(req: NextRequest) {
  const code   = req.nextUrl.searchParams.get('code')
  const userId = req.nextUrl.searchParams.get('state')
  if (!code || !userId) return new Response('Invalid callback', { status: 400 })

  try {
    const tokens = await exchangeGoogleCode(code)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Upsert integration
    const existing = await db.select().from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.provider, 'google')))
      .limit(1)

    if (existing.length > 0) {
      await db.update(integrations)
        .set({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token ?? existing[0].refreshToken, expiresAt, updatedAt: new Date() })
        .where(eq(integrations.id, existing[0].id))
    } else {
      await db.insert(integrations).values({
        userId,
        provider:     'google',
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt,
      })
    }
  } catch (err) {
    console.error('[google callback]', err)
    redirect('/onboarding?error=google')
  }

  redirect('/onboarding?connected=google')
}
