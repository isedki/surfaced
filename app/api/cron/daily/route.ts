import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { integrations, wins } from '@/lib/db/schema'
import { syncCalendarEvents } from '@/lib/integrations/google-calendar'
import { syncNotionPages }    from '@/lib/integrations/notion'
import { extractWins }        from '@/lib/ai/extract-wins'
import { generateDraftsForWin } from '@/lib/ai/generate-drafts'
import { eq, desc }           from 'drizzle-orm'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) return new Response('Forbidden', { status: 403 })

  // Get all users with at least one integration
  const allIntegrations = await db.select({ userId: integrations.userId }).from(integrations)
  const userIds = [...new Set(allIntegrations.map(i => i.userId))]

  const results = []
  for (const userId of userIds) {
    try {
      const [cal, notion] = await Promise.all([
        syncCalendarEvents(userId, 1),
        syncNotionPages(userId, 1),
      ])
      const winCount = await extractWins(userId, 1)
      if (winCount > 0) {
        const newWins = await db.select().from(wins)
          .where(eq(wins.userId, userId))
          .orderBy(desc(wins.createdAt))
          .limit(winCount)
        await Promise.all(newWins.map(w => generateDraftsForWin(w.id, userId)))
      }
      results.push({ userId, cal, notion, wins: winCount })
    } catch (err) {
      results.push({ userId, error: err instanceof Error ? err.message : 'Failed' })
    }
  }

  return Response.json({ processed: results.length, results })
}
