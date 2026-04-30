import { pgTable, text, integer, timestamp, jsonb, boolean, serial } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id:         text('id').primaryKey(), // Clerk user ID
  email:      text('email').notNull(),
  name:       text('name'),
  role:       text('role'),           // "Enterprise Architect", "Product Manager", etc.
  company:    text('company'),
  goals:      text('goals'),          // what they want to achieve visibility for
  createdAt:  timestamp('created_at').defaultNow().notNull(),
})

export const integrations = pgTable('integrations', {
  id:           serial('id').primaryKey(),
  userId:       text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider:     text('provider').notNull(), // 'google' | 'notion'
  accessToken:  text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt:    timestamp('expires_at'),
  metadata:     jsonb('metadata'),   // e.g. notion workspace info
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
})

export const activities = pgTable('activities', {
  id:          serial('id').primaryKey(),
  userId:      text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  source:      text('source').notNull(),   // 'google_calendar' | 'notion'
  externalId:  text('external_id'),        // original ID from source
  type:        text('type').notNull(),     // 'meeting' | 'document' | 'task' | 'block'
  title:       text('title').notNull(),
  description: text('description'),
  participants: jsonb('participants'),     // array of names/emails
  date:        timestamp('date').notNull(),
  rawData:     jsonb('raw_data'),
  processed:   boolean('processed').default(false),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})

export const wins = pgTable('wins', {
  id:           serial('id').primaryKey(),
  userId:       text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityIds:  jsonb('activity_ids').$type<number[]>().notNull(),
  title:        text('title').notNull(),
  impactSummary: text('impact_summary').notNull(),
  audienceHint:  text('audience_hint'),   // 'manager' | 'team' | 'public'
  date:         timestamp('date').notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
})

export const drafts = pgTable('drafts', {
  id:        serial('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  winId:     integer('win_id').notNull().references(() => wins.id, { onDelete: 'cascade' }),
  channel:   text('channel').notNull(),  // 'slack_team' | 'slack_dm' | 'email' | 'linkedin'
  content:   text('content').notNull(),
  tone:      text('tone'),
  sentAt:    timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const impactMemory = pgTable('impact_memory', {
  id:          serial('id').primaryKey(),
  userId:      text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  period:      text('period').notNull(),      // 'week:2026-W18' | 'month:2026-04'
  summary:     text('summary').notNull(),
  keyThemes:   jsonb('key_themes').$type<string[]>(),
  winCount:    integer('win_count').default(0),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
})
