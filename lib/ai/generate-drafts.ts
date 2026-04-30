import { generateText } from 'ai'
import { anthropic }    from '@ai-sdk/anthropic'
import { db }           from '@/lib/db'
import { drafts, wins, users } from '@/lib/db/schema'
import { eq }           from 'drizzle-orm'

const CHANNELS = ['slack_team', 'slack_dm', 'email', 'linkedin'] as const
type Channel = typeof CHANNELS[number]

const CHANNEL_INSTRUCTIONS: Record<Channel, string> = {
  slack_team: `Write a Slack message for a team channel. Casual but professional. 2-4 sentences max. Use one relevant emoji at the start. No hashtags. Share the impact, invite reaction or questions.`,
  slack_dm:   `Write a Slack DM to your manager. Direct, context-first. 3-5 sentences. Mention the impact, what you learned or decided, and any next steps. Professional but not formal.`,
  email:      `Write a brief email update (subject line + body). Professional tone. Subject should be punchy and specific. Body: 4-6 sentences. Mention impact, stakeholders, next steps.`,
  linkedin:   `Write a LinkedIn post. Thought-leadership tone. Start with a hook (not "I'm excited to share"). 3-5 short paragraphs. End with an insight or question to spark engagement. No hashtags.`,
}

export async function generateDraftsForWin(winId: number, userId: string): Promise<void> {
  const [win] = await db.select().from(wins).where(eq(wins.id, winId)).limit(1)
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!win) return

  const userContext = user
    ? `Name: ${user.name ?? 'the user'}. Role: ${user.role ?? 'professional'}. Company: ${user.company ?? ''}.`
    : ''

  for (const channel of CHANNELS) {
    // Skip linkedin for manager-only wins
    if (channel === 'linkedin' && win.audienceHint === 'manager') continue

    const { text } = await generateText({
      model:  anthropic('claude-sonnet-4-6'),
      system: `You are a communication coach helping a professional be more visible at work. Write in first person, as if you are them. Be authentic, not corporate. ${userContext}`,
      prompt: `Win to communicate:\nTitle: ${win.title}\nImpact: ${win.impactSummary}\n\nChannel instructions: ${CHANNEL_INSTRUCTIONS[channel]}\n\nWrite the ${channel.replace('_', ' ')} message now.`,
    })

    await db.insert(drafts).values({
      userId,
      winId,
      channel,
      content: text,
      tone:    channel.includes('linkedin') ? 'thought_leadership' : channel.includes('dm') ? 'direct' : 'professional',
    })
  }
}
