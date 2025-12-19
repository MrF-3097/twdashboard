import { db } from '@/db'
import { transactionEvents, transactionAgents, type Transaction } from '@/db/schema'
import { eq } from 'drizzle-orm'

type TransactionEventAction = 'created' | 'deleted'

/**
 * Logs a transaction event. For transactions with multiple agents, 
 * it logs the primary agent (first agent) for backward compatibility.
 * 
 * @param transaction - The transaction to log
 * @param action - The action performed ('created' or 'deleted')
 */
export const logTransactionEvent = async (transaction: Transaction, action: TransactionEventAction) => {
  try {
    // For transactions with multiple agents, we log the primary agent
    // The agent field may be null for new transactions, so we fetch from transactionAgents if needed
    let agentName = transaction.agent
    
    // If agent is null/empty, try to get from transactionAgents table
    if (!agentName) {
      try {
        const agents = await db.select()
          .from(transactionAgents)
          .where(eq(transactionAgents.transactionId, transaction.id))
          .limit(1)
        
        if (agents.length > 0) {
          agentName = agents[0].agentName
        }
      } catch (fetchError) {
        console.warn('[Transaction Events] Could not fetch agent from transactionAgents:', fetchError)
      }
    }

    await db.insert(transactionEvents).values({
      transactionId: transaction.id,
      agent: agentName || 'Unknown',
      valoareTranzactie: transaction.valoareTranzactie,
      tipTranzactie: transaction.tipTranzactie,
      comisionPct: transaction.comisionPct,
      comision: transaction.comision,
      action,
      eventTimestamp: transaction.timestamp ?? new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Transaction Events] Failed to log event', {
      action,
      transactionId: transaction.id,
      error,
    })
  }
}


