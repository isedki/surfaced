import { NextRequest } from 'next/server'
import { exchangeNotionCode } from '@/lib/integrations/notion'
import { db } from '@/lib/db'
import { integrations } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export async function GET(req: NextRequest) {
  const code   = req.nextUrl.searchParams.get('code')
  const userId = req.nextUrl.searchParams.get('state')
  if (!code || !userId) return new Response('Invalid callback', { status: 400 })

  try {
    const tokens = await exchangeNotionCode(code)

    const existing = await db.select().from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.provider, 'notion')))
      .limit(1)

    if (existing.length > 0) {
      await db.update(integrations)
        .set({ accessToken: tokens.access_token, metadata: { workspace_name: tokens.workspace_name, workspace_id: tokens.workspace_id }, updatedAt: new Date() })
        .where(eq(integrations.id, existing[0].id))
    } else {
      await db.insert(integrations).values({
        userId,
        provider:    'notion',
        accessToken: tokens.access_token,
        metadata:    { workspace_name: tokens.workspace_name, workspace_id: tokens.workspace_id },
      })
    }
  } catch (err) {
    console.error('[notion callback]', err)
    redirect('/onboarding?error=notion')
  }

  redirect('/onboarding?connected=notion')
}
