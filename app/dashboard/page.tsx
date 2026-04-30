import { auth } from '@clerk/nextjs/server'
import { db }   from '@/lib/db'
import { wins, drafts, integrations, users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import DashboardClient from '@/components/DashboardClient'

export default async function Dashboard() {
  const { userId } = await auth()
  if (!userId) return null

  const [recentWins, allIntegrations, userRow] = await Promise.all([
    db.select().from(wins).where(eq(wins.userId, userId!)).orderBy(desc(wins.createdAt)).limit(20),
    db.select().from(integrations).where(eq(integrations.userId, userId!)),
    db.select().from(users).where(eq(users.id, userId!)).limit(1),
  ])

  const winsWithDrafts = await Promise.all(recentWins.map(async win => {
    const winDrafts = await db.select().from(drafts)
      .where(eq(drafts.winId, win.id))
    return { ...win, drafts: winDrafts }
  }))

  const connectedProviders = allIntegrations.map(i => i.provider)
  const user = userRow[0] ?? null

  return (
    <DashboardClient
      wins={winsWithDrafts as any}
      connectedProviders={connectedProviders}
      user={user as any}
    />
  )
}
