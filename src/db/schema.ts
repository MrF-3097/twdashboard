import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core'

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agent: text('agent').notNull(),
  valoareTranzactie: real('valoare_tranzactie').notNull(),
  tipTranzactie: text('tip_tranzactie').notNull(), // 'Vanzare' | 'Inchiriere'
  comisionPct: real('comision_pct').notNull(),
  comision: real('comision').notNull(),
  timestamp: text('timestamp').notNull(), // ISO string
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

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

