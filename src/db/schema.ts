import { sqliteTable, text, real, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agent: text('agent'), // Deprecated: kept for backward compatibility, use transactionAgents table instead
  valoareTranzactie: real('valoare_tranzactie').notNull(),
  tipTranzactie: text('tip_tranzactie').notNull(), // 'Vanzare' | 'Inchiriere'
  comisionPct: real('comision_pct').notNull(),
  comision: real('comision').notNull(),
  timestamp: text('timestamp').notNull(), // ISO string
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  agentIdx: index('transactions_agent_idx').on(table.agent),
  timestampIdx: index('transactions_timestamp_idx').on(table.timestamp),
  createdAtIdx: index('transactions_created_at_idx').on(table.createdAt),
}))

// Transaction agents: supports multiple agents per transaction with roles
export const transactionAgents = sqliteTable('transaction_agents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  transactionId: integer('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  agentName: text('agent_name').notNull(),
  role: text('role').notNull(), // 'buyer_rentee' | 'owner'
  commissionSource: text('commission_source').notNull(), // 'buyer_rentee' | 'owner'
  splitPct: real('split_pct'), // Split percentage within the role's commission pool (0-100)
  commissionPct: real('commission_pct').notNull(), // Commission percentage for this agent (of transaction value)
  commission: real('commission').notNull(), // Commission amount for this agent
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  transactionIdIdx: index('transaction_agents_transaction_id_idx').on(table.transactionId),
  agentNameIdx: index('transaction_agents_agent_name_idx').on(table.agentName),
}))

export const agentTargets = sqliteTable('agent_targets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agentName: text('agent_name').notNull().unique(),
  monthlyTarget: real('monthly_target').notNull().default(16000),
  annualTarget: real('annual_target').notNull().default(120000),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Quest progress tracking tables
export const agentPropertyCounts = sqliteTable('agent_property_counts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agentId: integer('agent_id').notNull(),
  agentName: text('agent_name').notNull(),
  previousCount: integer('previous_count').notNull().default(0),
  currentCount: integer('current_count').notNull().default(0),
  lastFetchAt: integer('last_fetch_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const agentTransactionCounts = sqliteTable('agent_transaction_counts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agentId: integer('agent_id').notNull(),
  agentName: text('agent_name').notNull(),
  previousSalesCount: integer('previous_sales_count').notNull().default(0),
  currentSalesCount: integer('current_sales_count').notNull().default(0),
  previousRentalsCount: integer('previous_rentals_count').notNull().default(0),
  currentRentalsCount: integer('current_rentals_count').notNull().default(0),
  lastFetchAt: integer('last_fetch_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const questProgress = sqliteTable('quest_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agentId: integer('agent_id').notNull(),
  agentName: text('agent_name').notNull(),
  questId: text('quest_id').notNull(), // e.g., 'proprietati-preluate', 'vanzare', 'chirie'
  questType: text('quest_type').notNull(), // 'individual' | 'group'
  currentProgress: integer('current_progress').notNull().default(0),
  targetProgress: integer('target_progress').notNull().default(10), // Default target is 10
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  lastUpdatedAt: integer('last_updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agentId: integer('agent_id').notNull(),
  agentName: text('agent_name').notNull(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  agentIdIdx: index('push_subscriptions_agent_id_idx').on(table.agentId),
  agentNameIdx: index('push_subscriptions_agent_name_idx').on(table.agentName),
}))

export const leaderboardHistory = sqliteTable('leaderboard_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  firstPlaceAgentName: text('first_place_agent_name').notNull(),
  firstPlaceTotal: real('first_place_total').notNull(),
  changedAt: integer('changed_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const leaderboardStandings = sqliteTable(
  'leaderboard_standings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    agentName: text('agent_name').notNull(),
    rank: integer('rank').notNull(),
    total: real('total').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  },
  table => ({
    agentNameIdx: uniqueIndex('leaderboard_standings_agent_name_unique').on(table.agentName),
    rankIdx: index('leaderboard_standings_rank_idx').on(table.rank),
    totalIdx: index('leaderboard_standings_total_idx').on(table.total),
  })
)

export const transactionEvents = sqliteTable('transaction_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  transactionId: integer('transaction_id'),
  agent: text('agent').notNull(),
  valoareTranzactie: real('valoare_tranzactie').notNull(),
  tipTranzactie: text('tip_tranzactie').notNull(),
  comisionPct: real('comision_pct').notNull(),
  comision: real('comision').notNull(),
  action: text('action').notNull(), // 'created' | 'deleted'
  eventTimestamp: text('event_timestamp').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const leadEvents = sqliteTable('lead_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  requestId: integer('request_id'), // REBS request ID
  contactId: integer('contact_id'), // REBS contact ID
  agentName: text('agent_name').notNull(),
  agentId: integer('agent_id'),
  clientName: text('client_name').notNull(), // Full name (prenume + nume)
  phone: text('phone'),
  email: text('email'),
  tipProprietate: text('tip_proprietate'),
  camereMin: integer('camere_min'),
  camereMax: integer('camere_max'),
  bugetMin: real('buget_min'),
  bugetMax: real('buget_max'),
  eventTimestamp: text('event_timestamp').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const knownAgents = sqliteTable('known_agents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agentId: integer('agent_id').notNull(),
  agentName: text('agent_name').notNull(),
  email: text('email'),
  firstSeenAt: integer('first_seen_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, table => ({
  agentIdIdx: uniqueIndex('known_agents_agent_id_unique').on(table.agentId),
}))

export const newsItems = sqliteTable('news_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemType: text('item_type').notNull(), // 'transaction' | 'welcome'
  agentId: integer('agent_id'),
  agentName: text('agent_name').notNull(),
  agentAvatar: text('agent_avatar'),
  // For transaction items
  transactionValue: real('transaction_value'),
  commission: real('commission'),
  transactionType: text('transaction_type'), // 'Vanzare' | 'Chirie'
  propertyType: text('property_type'),
  location: text('location'),
  // For welcome items
  welcomeMessage: text('welcome_message'),
  timestamp: text('timestamp').notNull(), // ISO string
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  timestampIdx: index('news_items_timestamp_idx').on(table.timestamp),
  createdAtIdx: index('news_items_created_at_idx').on(table.createdAt),
  agentNameIdx: index('news_items_agent_name_idx').on(table.agentName),
  itemTypeIdx: index('news_items_item_type_idx').on(table.itemType),
}))

// Historic leaderboard snapshots - stores monthly leaderboard data for TV display
export const historicSnapshots = sqliteTable('historic_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  year: integer('year').notNull(),
  month: integer('month').notNull(), // 1-12
  // Snapshot data stored as JSON
  agentsJson: text('agents_json').notNull(), // JSON array of agent data
  statsJson: text('stats_json'), // JSON object with stats (total_agents, total_transactions, etc.)
  // Metadata
  totalAgents: integer('total_agents').notNull().default(0),
  totalTransactions: integer('total_transactions').notNull().default(0),
  totalCommission: real('total_commission').notNull().default(0),
  topPerformerName: text('top_performer_name'),
  topPerformerCommission: real('top_performer_commission'),
  // Timestamps
  snapshotTimestamp: integer('snapshot_timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  // Unique constraint: only one snapshot per year-month
  yearMonthIdx: uniqueIndex('historic_snapshots_year_month_unique').on(table.year, table.month),
  yearIdx: index('historic_snapshots_year_idx').on(table.year),
}))

export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type AgentTarget = typeof agentTargets.$inferSelect
export type NewAgentTarget = typeof agentTargets.$inferInsert
export type AgentPropertyCount = typeof agentPropertyCounts.$inferSelect
export type NewAgentPropertyCount = typeof agentPropertyCounts.$inferInsert
export type AgentTransactionCount = typeof agentTransactionCounts.$inferSelect
export type NewAgentTransactionCount = typeof agentTransactionCounts.$inferInsert
export type QuestProgress = typeof questProgress.$inferSelect
export type NewQuestProgress = typeof questProgress.$inferInsert
export type PushSubscription = typeof pushSubscriptions.$inferSelect
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert
export type LeaderboardHistory = typeof leaderboardHistory.$inferSelect
export type NewLeaderboardHistory = typeof leaderboardHistory.$inferInsert
export type LeaderboardStanding = typeof leaderboardStandings.$inferSelect
export type NewLeaderboardStanding = typeof leaderboardStandings.$inferInsert
export type TransactionEvent = typeof transactionEvents.$inferSelect
export type NewTransactionEvent = typeof transactionEvents.$inferInsert
export type LeadEvent = typeof leadEvents.$inferSelect
export type NewLeadEvent = typeof leadEvents.$inferInsert
export type KnownAgent = typeof knownAgents.$inferSelect
export type NewKnownAgent = typeof knownAgents.$inferInsert
export type NewsItem = typeof newsItems.$inferSelect
export type NewNewsItem = typeof newsItems.$inferInsert
export type TransactionAgent = typeof transactionAgents.$inferSelect
export type NewTransactionAgent = typeof transactionAgents.$inferInsert
export type HistoricSnapshot = typeof historicSnapshots.$inferSelect
export type NewHistoricSnapshot = typeof historicSnapshots.$inferInsert

