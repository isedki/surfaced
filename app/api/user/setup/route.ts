import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const clerkUser = await currentUser()
  const body = await req.json()

  const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (existing.length > 0) {
    await db.update(users).set({ role: body.role, company: body.company, goals: body.goals }).where(eq(users.id, userId))
  } else {
    await db.insert(users).values({
      id:      userId,
      email:   clerkUser?.emailAddresses[0]?.emailAddress ?? '',
      name:    clerkUser?.fullName ?? '',
      role:    body.role,
      company: body.company,
      goals:   body.goals,
    })
  }
  return Response.json({ ok: true })
}
