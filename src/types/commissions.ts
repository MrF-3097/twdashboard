import { z } from 'zod'

// Agent role and commission source enums
export const agentRoleSchema = z.enum(['buyer_rentee', 'owner'])
export const commissionSourceSchema = z.enum(['buyer_rentee', 'owner'])

// Schema for individual agent assignment in a transaction
export const transactionAgentSchema = z.object({
  agentName: z.string().min(1, 'Agent name is required'),
  role: agentRoleSchema,
  commissionSource: commissionSourceSchema,
  splitPct: z.union([z.number(), z.string()]).transform((v) => {
    // Split percentage within the role's commission pool (0-100)
    if (typeof v === 'number') return v
    const trimmed = String(v).trim()
    if (trimmed.endsWith('%')) {
      const n = Number(trimmed.slice(0, -1).replace(/,/g, '.'))
      return Number.isFinite(n) ? n : 0
    }
    const n = Number(trimmed.replace(/,/g, '.'))
    return Number.isFinite(n) ? n : 0
  }),
  commissionPct: z.union([z.number(), z.string()]).transform((v) => {
    // Total commission percentage of transaction value (for backward compatibility)
    if (typeof v === 'number') return v
    const trimmed = String(v).trim()
    if (trimmed.endsWith('%')) {
      const n = Number(trimmed.slice(0, -1).replace(/,/g, '.'))
      return Number.isFinite(n) ? n / 100 : 0
    }
    const n = Number(trimmed.replace(/,/g, '.'))
    if (!Number.isFinite(n)) return 0
    return n > 1 ? n / 100 : n
  }),
  commission: z.union([z.number(), z.string()]).transform((v) => {
    if (typeof v === 'number') return v
    const cleaned = String(v).replace(/[^0-9.,-]/g, '').replace(/,/g, '.')
    const num = Number(cleaned)
    return Number.isFinite(num) ? num : 0
  }),
})

export type TransactionAgent = z.infer<typeof transactionAgentSchema>

// Updated transaction schema supporting multiple agents
export const transactionSchema = z.object({
  Agent: z.string().optional(), // Deprecated: kept for backward compatibility
  agents: z.array(transactionAgentSchema).optional(), // New: array of agents with roles
  'Valoare Tranzactie': z.union([z.number(), z.string()]).transform((v) => {
    if (typeof v === 'number') return v
    const cleaned = v.replace(/[^0-9.,-]/g, '').replace(/,/g, '.')
    const num = Number(cleaned)
    return Number.isFinite(num) ? num : 0
  }),
  'Tip Tranzactie': z.enum(['Inchiriere', 'Vanzare']),
  'Comision %': z.union([z.number(), z.string()]).transform((v) => {
    if (typeof v === 'number') return v
    const trimmed = v.trim()
    if (trimmed.endsWith('%')) {
      const n = Number(trimmed.slice(0, -1).replace(/,/g, '.'))
      return Number.isFinite(n) ? n / 100 : 0
    }
    const n = Number(trimmed.replace(/,/g, '.'))
    if (!Number.isFinite(n)) return 0
    return n > 1 ? n / 100 : n
  }),
  Comision: z.union([z.number(), z.string()]).transform((v) => {
    if (typeof v === 'number') return v
    const cleaned = v.replace(/[^0-9.,-]/g, '').replace(/,/g, '.')
    const num = Number(cleaned)
    return Number.isFinite(num) ? num : 0
  }),
  Timestamp: z.string(),
}).refine((data) => {
  // Either old Agent field or new agents array must be provided
  return data.Agent || (data.agents && data.agents.length > 0)
}, {
  message: 'Either Agent or agents array must be provided',
})

export type Transaction = z.infer<typeof transactionSchema>

export const leaderboardRowSchema = z.object({
  Rank: z.number(),
  Agent: z.string(),
  NrTranzactii: z.number(),
  SumaValoare: z.number(),
  SumaComision: z.number(),
})

export type LeaderboardRow = z.infer<typeof leaderboardRowSchema>

export const transactionsResponseSchema = z.object({
  updatedAt: z.string(),
  count: z.number(),
  rows: z.array(transactionSchema),
})

export const leaderboardResponseSchema = z.object({
  updatedAt: z.string(),
  count: z.number(),
  rows: z.array(leaderboardRowSchema),
})

export type TransactionsResponse = z.infer<typeof transactionsResponseSchema>
export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>






