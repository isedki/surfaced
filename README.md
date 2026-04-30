# Surfaced

**Your impact, made visible.**

Surfaced passively captures your daily activity from Google Calendar and Notion, extracts the moments worth communicating, and drafts ready-to-send messages — so you stop being the best-kept secret in your company.

No daily journaling. No effort. Just your work, surfaced.

---

## How it works

1. Connect Google Calendar and Notion via OAuth
2. Surfaced reads what happened today (meetings, documents, decisions)
3. AI extracts 3–5 "visibility moments" worth communicating
4. Each win gets ready-to-copy drafts: Slack post, Slack DM to manager, email, LinkedIn
5. Your impact story builds in memory over time

---

## Tech stack

- **Next.js 16** App Router
- **Clerk** — authentication + Google OAuth
- **Neon** — PostgreSQL database (serverless)
- **Drizzle ORM** — type-safe DB queries
- **AI SDK v4 + Claude Sonnet** — win extraction + draft generation
- **Vercel** — hosting + cron jobs (5pm daily digest, Mon–Fri)

---

## Setup guide

### 1. Clone and install

```bash
git clone https://github.com/isedki/surfaced.git
cd surfaced
npm install
```

---

### 2. Clerk — Authentication

1. Go to [clerk.com](https://clerk.com) and create a free account
2. Create a new application → enable **Google** as a social login provider
3. In your Clerk dashboard → **API Keys**, copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

---

### 3. Neon — PostgreSQL database

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project (any name, e.g. `surfaced`)
3. From the project dashboard, copy the **Connection string** (starts with `postgres://...`)
4. Paste it as `DATABASE_URL`

---

### 4. Anthropic — Claude API

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Paste it as `ANTHROPIC_API_KEY`

---

### 5. Google OAuth — Calendar access

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable the **Google Calendar API**:
   - APIs & Services → Library → search "Google Calendar API" → Enable
4. Create OAuth credentials:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: **Web application**
   - Authorized redirect URIs: add `http://localhost:3000/api/integrations/google/callback`
   - For production: also add `https://your-domain.com/api/integrations/google/callback`
5. Copy the **Client ID** and **Client Secret**

> **Note:** You'll also need to configure the OAuth consent screen (APIs & Services → OAuth consent screen). Add the scope `https://www.googleapis.com/auth/calendar.readonly`.

---

### 6. Notion OAuth — Workspace access

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **New integration** → type: **Public**
3. Set the redirect URI to: `http://localhost:3000/api/integrations/notion/callback`
   - For production: `https://your-domain.com/api/integrations/notion/callback`
4. Copy the **OAuth client ID** and **OAuth client secret**

---

### 7. Environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Neon
DATABASE_URL=postgres://user:pass@host/dbname?sslmode=require

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google OAuth
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Notion OAuth
NOTION_CLIENT_ID=...
NOTION_CLIENT_SECRET=secret_...

# Cron (any random string — used to secure the daily cron endpoint)
CRON_SECRET=replace-with-any-random-string
```

---

### 8. Create database tables

```bash
npm run db:push
```

This creates all tables in your Neon database using the Drizzle schema.

---

### 9. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Then add all environment variables in the Vercel dashboard (Settings → Environment Variables), or via CLI:

```bash
vercel env add ANTHROPIC_API_KEY
vercel env add CLERK_SECRET_KEY
# ... repeat for each variable
```

After deploying, update your Google and Notion OAuth redirect URIs to use your production URL.

The daily cron (5pm Mon–Fri) is configured in `vercel.json` and runs automatically on Vercel.

---

## Database schema

| Table | Purpose |
|---|---|
| `users` | User profile, role, company, goals |
| `integrations` | OAuth tokens for Google and Notion |
| `activities` | Raw events captured from Calendar and Notion |
| `wins` | AI-extracted visibility moments |
| `drafts` | Generated messages per channel (Slack, email, LinkedIn) |
| `impact_memory` | Weekly/monthly impact summaries |

---

## Project structure

```
app/
  page.tsx                    # Landing page
  dashboard/page.tsx          # Main dashboard
  onboarding/page.tsx         # Connect integrations
  api/
    sync/route.ts             # Manual sync endpoint
    cron/daily/route.ts       # Daily automated sync
    drafts/route.ts           # Fetch wins + drafts
    user/setup/route.ts       # Save user profile
    integrations/
      connect/google/         # Initiate Google OAuth
      connect/notion/         # Initiate Notion OAuth
      google/callback/        # Google OAuth callback
      notion/callback/        # Notion OAuth callback

lib/
  db/schema.ts                # Drizzle table definitions
  db/index.ts                 # Neon + Drizzle client
  integrations/
    google-calendar.ts        # Calendar sync + token refresh
    notion.ts                 # Notion pages sync
  ai/
    extract-wins.ts           # Claude: find visibility moments
    generate-drafts.ts        # Claude: write channel-specific drafts

components/
  DashboardClient.tsx         # Dashboard UI (client component)
  WinCard.tsx                 # Win + draft display with copy button
```

---

## Built by

[Issam Sedki, PhD](https://issam-resume.vercel.app) — Enterprise Architect & AI Researcher
