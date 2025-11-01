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

export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type AgentTarget = typeof agentTargets.$inferSelect
export type NewAgentTarget = typeof agentTargets.$inferInsert

