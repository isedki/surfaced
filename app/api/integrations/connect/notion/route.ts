import { auth } from '@clerk/nextjs/server'
import { getNotionAuthUrl } from '@/lib/integrations/notion'
import { redirect } from 'next/navigation'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })
  redirect(getNotionAuthUrl(userId))
}
