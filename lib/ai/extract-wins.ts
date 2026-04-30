import { generateObject } from 'ai'
import { anthropic }      from '@ai-sdk/anthropic'
import { z }              from 'zod'
import { db }             from '@/lib/db'
import { activities, wins, users } from '@/lib/db/schema'
import { eq, and }        from 'drizzle-orm'

const WinSchema = z.object({
  wins: z.array(z.object({
    title:         z.string().describe('Short, punchy title for this win — action-oriented'),
    impactSummary: z.string().describe('1-2 sentence impact framing: what happened, who benefited, why it matters. Use concrete language.'),
    audienceHint:  z.enum(['manager', 'team', 'public']).describe('Best primary audience'),
    activityIds:   z.array(z.number()).describe('IDs of source activities that make up this win'),
  })).min(0).max(5).describe('Visibility moments worth communicating. Empty array if nothing noteworthy.'),
})

export async function extractWins(userId: string, daysBack = 1): Promise<number> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  const rawActivities = await db.select()
    .from(activities)
    .where(and(eq(activities.userId, userId), eq(activities.processed, false)))

  if (rawActivities.length === 0) return 0

  const context = rawActivities.map(a =>
    `[ID:${a.id}] [${a.source}] ${a.type.toUpperCase()}: "${a.title}"` +
    (a.description ? ` — ${a.description.slice(0, 200)}` : '') +
    (Array.isArray(a.participants) && a.participants.length > 0
      ? ` (with: ${(a.participants as any[]).map((p: any) => p.name ?? p.email).join(', ')})`
      : '') +
    ` | ${a.date.toLocaleDateString()}`
  ).join('\n')

  const userContext = user
    ? `Role: ${user.role ?? 'professional'}. Company: ${user.company ?? 'unknown'}. Goals: ${user.goals ?? 'be visible and show impact'}.`
    : ''

  const { object } = await generateObject({
    model:  anthropic('claude-sonnet-4-6'),
    schema: WinSchema,
    system: `You are a communication coach who helps professionals become more visible at work.
Your job: look at today's work activities and extract the moments worth communicating to colleagues, managers, or publicly.

Focus on:
- Meetings where decisions were made, people were unblocked, or consensus was reached
- Documents/pages that represent real work output (not just minor edits)
- Patterns across multiple activities (e.g., "ran 3 cross-team syncs this week")
- Impact on others — who did they help, unblock, or influence?

Do NOT flag:
- Routine status meetings with no clear output
- Minor document edits
- Internal logistics

Be concrete and specific. Avoid generic corporate language. ${userContext}`,
    prompt: `Here are today's activities:\n\n${context}\n\nExtract the visibility moments worth communicating.`,
  })

  // Store wins and mark activities as processed
  let created = 0
  for (const win of object.wins) {
    await db.insert(wins).values({
      userId,
      activityIds:   win.activityIds,
      title:         win.title,
      impactSummary: win.impactSummary,
      audienceHint:  win.audienceHint,
      date:          new Date(),
    })
    created++
  }

  // Mark activities as processed
  for (const a of rawActivities) {
    await db.update(activities).set({ processed: true }).where(eq(activities.id, a.id))
  }

  return created
}
