import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function getTokenUsageFilePath() {
  return path.join(process.cwd(), 'data', 'token-usage.json')
}

function readTokenUsage() {
  try {
    const filePath = getTokenUsageFilePath()
    if (!fs.existsSync(filePath)) {
      return []
    }
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading token usage:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const usage = readTokenUsage()
    
    console.log('Raw token usage data:', usage)
    console.log('Number of entries:', usage.length)
    
    // Aggregate by agent
    const agentStats: Record<number, {
      agentId: number
      agentName: string
      totalTokens: number
      totalCostRON: number
      usageCount: number
    }> = {}
    
    usage.forEach((entry: any) => {
      if (!entry || !entry.agentId) {
        console.warn('Invalid entry:', entry)
        return
      }
      
      if (!agentStats[entry.agentId]) {
        agentStats[entry.agentId] = {
          agentId: entry.agentId,
          agentName: entry.agentName || 'Unknown',
          totalTokens: 0,
          totalCostRON: 0,
          usageCount: 0
        }
      }
      
      const tokensUsed = Number(entry.tokensUsed) || 0
      const costInRON = Number(entry.costInRON) || 0
      
      agentStats[entry.agentId].totalTokens += tokensUsed
      agentStats[entry.agentId].totalCostRON += costInRON
      agentStats[entry.agentId].usageCount += 1
      
      console.log(`Agent ${entry.agentId}: +${tokensUsed} tokens, +${costInRON} RON`)
    })
    
    // Convert to array and sort by total cost descending
    const statsArray = Object.values(agentStats).sort((a, b) => b.totalCostRON - a.totalCostRON)
    
    console.log('Aggregated stats:', statsArray)
    
    return NextResponse.json({
      success: true,
      data: statsArray,
      totalEntries: usage.length
    })
  } catch (error) {
    console.error('Error fetching token usage:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch token usage' },
      { status: 500 }
    )
  }
}

