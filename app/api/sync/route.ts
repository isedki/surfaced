import { auth } from '@clerk/nextjs/server'
import { syncCalendarEvents } from '@/lib/integrations/google-calendar'
import { syncNotionPages }    from '@/lib/integrations/notion'
import { extractWins }        from '@/lib/ai/extract-wins'
import { generateDraftsForWin } from '@/lib/ai/generate-drafts'
import { db }                 from '@/lib/db'
import { wins }               from '@/lib/db/schema'
import { eq, desc }           from 'drizzle-orm'

export const maxDuration = 60

export async function POST() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [calendarSynced, notionSynced] = await Promise.all([
      syncCalendarEvents(userId, 1),
      syncNotionPages(userId, 1),
    ])

    const winCount = await extractWins(userId, 1)

    // Generate drafts for new wins
    if (winCount > 0) {
      const newWins = await db.select().from(wins)
        .where(eq(wins.userId, userId))
        .orderBy(desc(wins.createdAt))
        .limit(winCount)

      await Promise.all(newWins.map(w => generateDraftsForWin(w.id, userId)))
    }

    return Response.json({
      synced: { calendar: calendarSynced, notion: notionSynced },
      wins:   winCount,
    })
  } catch (err) {
    console.error('[sync]', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Sync failed' }, { status: 500 })
  }
}
