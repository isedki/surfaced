import { db } from '@/lib/db'
import { integrations, activities } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { subDays } from 'date-fns'

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

export function getNotionAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id:     process.env.NOTION_CLIENT_ID!,
    redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/notion/callback`,
    response_type: 'code',
    owner:         'user',
    state:         userId,
  })
  return `https://api.notion.com/v1/oauth/authorize?${params}`
}

export async function exchangeNotionCode(code: string): Promise<{
  access_token: string; workspace_name?: string; workspace_id: string; bot_id: string
}> {
  const credentials = Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64')
  const res = await fetch(`${NOTION_API}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type:   'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/notion/callback`,
    }),
  })
  if (!res.ok) throw new Error(`Notion token exchange failed: ${await res.text()}`)
  return res.json()
}

async function notionFetch(token: string, path: string, options: RequestInit = {}) {
  const res = await fetch(`${NOTION_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    },
  })
  if (!res.ok) throw new Error(`Notion API error: ${res.status}`)
  return res.json()
}

export async function syncNotionPages(userId: string, daysBack = 1): Promise<number> {
  const [integration] = await db.select()
    .from(integrations)
    .where(and(eq(integrations.userId, userId), eq(integrations.provider, 'notion')))
    .limit(1)

  if (!integration) return 0

  const since = subDays(new Date(), daysBack).toISOString()

  const data = await notionFetch(integration.accessToken, '/search', {
    method: 'POST',
    body: JSON.stringify({
      filter: { value: 'page', property: 'object' },
      sort:   { direction: 'descending', timestamp: 'last_edited_time' },
      page_size: 30,
    }),
  })

  const pages: any[] = (data.results ?? []).filter(
    (p: any) => p.last_edited_time >= since
  )

  let synced = 0
  for (const page of pages) {
    const title =
      page.properties?.title?.title?.[0]?.plain_text ??
      page.properties?.Name?.title?.[0]?.plain_text ??
      'Untitled'

    const existing = await db.select().from(activities)
      .where(and(eq(activities.userId, userId), eq(activities.externalId, page.id)))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(activities).values({
        userId,
        source:      'notion',
        externalId:  page.id,
        type:        'document',
        title,
        description: null,
        participants: [],
        date:        new Date(page.last_edited_time),
        rawData:     page,
      })
      synced++
    }
  }
  return synced
}
