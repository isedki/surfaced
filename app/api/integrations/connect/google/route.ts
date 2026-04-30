import { auth } from '@clerk/nextjs/server'
import { getGoogleAuthUrl } from '@/lib/integrations/google-calendar'
import { redirect } from 'next/navigation'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })
  const url = getGoogleAuthUrl(userId)
  redirect(url)
}
