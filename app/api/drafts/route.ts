import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { drafts, wins } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url    = new URL(req.url)
  const winId  = url.searchParams.get('winId')

  if (winId) {
    const rows = await db.select().from(drafts)
      .where(and(eq(drafts.userId, userId), eq(drafts.winId, parseInt(winId))))
    return Response.json(rows)
  }

  // Return recent wins with their drafts
  const recentWins = await db.select().from(wins)
    .where(eq(wins.userId, userId))
    .orderBy(desc(wins.createdAt))
    .limit(20)

  const winsWithDrafts = await Promise.all(recentWins.map(async win => {
    const winDrafts = await db.select().from(drafts)
      .where(and(eq(drafts.userId, userId), eq(drafts.winId, win.id)))
    return { ...win, drafts: winDrafts }
  }))

  return Response.json(winsWithDrafts)
}
