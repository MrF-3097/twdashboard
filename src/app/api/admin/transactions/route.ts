import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { transactions } from '@/db/schema'
import { desc, eq, gte, and, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // No cache - always fetch fresh data

const DEFAULT_LIMIT = 100

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = Number(searchParams.get('limit') || DEFAULT_LIMIT)
    const limit = Number.isNaN(limitParam) || limitParam <= 0 ? DEFAULT_LIMIT : Math.min(limitParam, 500)
    const agentFilter = searchParams.get('agent')
    const sinceParam = searchParams.get('since') // ISO date string for filtering by date

    // Build where conditions array
    const conditions = []
    
    // Apply date filter if 'since' parameter is provided
    if (sinceParam) {
      try {
        const sinceDate = new Date(sinceParam)
        if (!isNaN(sinceDate.getTime())) {
          conditions.push(gte(transactions.timestamp, sinceDate))
        }
      } catch (dateError) {
        console.warn('Invalid since parameter:', sinceParam)
      }
    }
    
    // First, fetch ALL transactions to see what agent names exist (for debugging)
    const allSampleRows = await db.select().from(transactions).limit(100);
    console.log(`[Transactions API] Total transactions in database: ${allSampleRows.length}`);
    if (allSampleRows.length > 0) {
      const uniqueAgents = [...new Set(allSampleRows.map(r => r.agent))];
      console.log(`[Transactions API] ========== DEBUGGING AGENT NAMES ==========`);
      console.log(`[Transactions API] All unique agent names in database (${uniqueAgents.length}):`, uniqueAgents);
      console.log(`[Transactions API] Searching for agent: "${agentFilter}"`);
      if (agentFilter) {
        console.log(`[Transactions API] Exact match found:`, uniqueAgents.includes(agentFilter));
        console.log(`[Transactions API] Case-insensitive match:`, uniqueAgents.some(a => a.toLowerCase().trim() === agentFilter.toLowerCase().trim()));
        // Check for partial matches
        const partialMatches = uniqueAgents.filter(a => 
          a.toLowerCase().includes(agentFilter.toLowerCase()) || 
          agentFilter.toLowerCase().includes(a.toLowerCase())
        );
        console.log(`[Transactions API] Partial matches:`, partialMatches);
        // Show character-by-character comparison
        if (uniqueAgents.length > 0) {
          const firstAgent = uniqueAgents[0];
          console.log(`[Transactions API] First agent in DB: "${firstAgent}" (length: ${firstAgent.length})`);
          console.log(`[Transactions API] Search term: "${agentFilter}" (length: ${agentFilter?.length || 0})`);
          console.log(`[Transactions API] Character codes comparison:`, {
            dbAgent: firstAgent.split('').map(c => `${c}(${c.charCodeAt(0)})`),
            searchTerm: agentFilter?.split('').map(c => `${c}(${c.charCodeAt(0)})`) || [],
          });
        }
      }
      console.log(`[Transactions API] ==========================================`);
    }
    
    // Apply agent filter if provided - use case-insensitive matching
    if (agentFilter) {
      // Use SQL LOWER() for case-insensitive comparison
      // SQLite uses LOWER() function for case-insensitive text comparison
      // Also trim whitespace to handle any spacing differences
      const trimmedFilter = agentFilter.trim();
      conditions.push(
        sql`LOWER(TRIM(${transactions.agent})) = LOWER(${trimmedFilter})`
      )
      console.log(`[Transactions API] Applying agent filter (case-insensitive): "${trimmedFilter}"`);
    }
    
    // Build query with combined conditions
    const filteredQuery = conditions.length > 0
      ? db.select().from(transactions).where(and(...conditions))
      : db.select().from(transactions)
    
    const rows = await filteredQuery.orderBy(desc(transactions.timestamp)).limit(limit)

    // Log for debugging - also log sample agent names if no filter
    if (!agentFilter && rows.length > 0) {
      const sampleAgents = [...new Set(rows.slice(0, 5).map(r => r.agent))];
      console.log(`[Transactions API] Sample agent names in database:`, sampleAgents);
    }

    // Log for debugging
    console.log(`[Transactions API] Fetched ${rows.length} transactions`, {
      limit,
      hasSinceFilter: !!sinceParam,
      hasAgentFilter: !!agentFilter,
      agentFilter,
      sampleAgentNames: rows.length > 0 ? [...new Set(rows.slice(0, 3).map(r => r.agent))] : [],
    })

    const serialized = rows.map((row) => ({
      id: row.id,
      // Mobile app expects capitalized field names
      Agent: row.agent,
      Timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp,
      'Valoare Tranzactie': row.valoareTranzactie,
      'Comision %': Number((row.comisionPct * 100).toFixed(2)),
      Comision: row.comision,
      Tip: row.tipTranzactie,
      // Also include lowercase versions for backward compatibility
      agent: row.agent,
      timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp,
      valoareTranzactie: row.valoareTranzactie,
      tipTranzactie: row.tipTranzactie,
      comision: row.comision,
      comisionPctDecimal: row.comisionPct,
      comisionPctPercent: Number((row.comisionPct * 100).toFixed(2)),
    }))

    return NextResponse.json({
      success: true,
      data: {
        rows: serialized, // Mobile app expects 'rows' key
        transactions: serialized, // Keep for backward compatibility
      },
      meta: {
        count: serialized.length,
        limit,
      },
    })
  } catch (error) {
    console.error('❌ [API] Error fetching admin transactions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transactions',
      },
      { status: 500 }
    )
  }
}


