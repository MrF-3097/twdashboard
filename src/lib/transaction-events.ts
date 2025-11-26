import { db } from '@/db'
import { transactionEvents, type Transaction } from '@/db/schema'

type TransactionEventAction = 'created' | 'deleted'

export const logTransactionEvent = async (transaction: Transaction, action: TransactionEventAction) => {
  try {
    await db.insert(transactionEvents).values({
      transactionId: transaction.id,
      agent: transaction.agent,
      valoareTranzactie: transaction.valoareTranzactie,
      tipTranzactie: transaction.tipTranzactie,
      comisionPct: transaction.comisionPct,
      comision: transaction.comision,
      action,
      eventTimestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Transaction Events] Failed to log event', {
      action,
      transactionId: transaction.id,
      error,
    })
  }
}


