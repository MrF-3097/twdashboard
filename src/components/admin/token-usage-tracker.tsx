'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Coins, TrendingUp } from 'lucide-react'

interface TokenUsageStats {
  agentId: number
  agentName: string
  totalTokens: number
  totalCostRON: number
  usageCount: number
}

export const TokenUsageTracker = () => {
  const [stats, setStats] = useState<TokenUsageStats[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTokenUsage = async () => {
      try {
        const response = await fetch('/api/admin/token-usage')
        const result = await response.json()
        
        console.log('Token usage API response:', result)
        
        if (result.success) {
          console.log('Token usage stats:', result.data)
          setStats(result.data || [])
        } else {
          console.error('Token usage API error:', result.error)
        }
      } catch (error) {
        console.error('Error fetching token usage:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTokenUsage()
    // Refresh every 30 seconds
    const interval = setInterval(fetchTokenUsage, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredStats = selectedAgent === 'all' 
    ? stats 
    : stats.filter(s => s.agentId.toString() === selectedAgent)

  const totalTokens = filteredStats.reduce((sum, s) => sum + s.totalTokens, 0)
  const totalCost = filteredStats.reduce((sum, s) => sum + s.totalCostRON, 0)

  const formatNumber = (num: number) => {
    if (num === 0) return '0'
    if (num < 0.01) {
      // For very small numbers, show more decimal places
      return num.toFixed(6).replace(/\.?0+$/, '')
    }
    return new Intl.NumberFormat('ro-RO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(num)
  }
  
  const formatCost = (num: number) => {
    if (num === 0) return '0.00'
    // Always show at least 4 decimal places for cost
    return num.toFixed(4).replace(/\.?0+$/, '')
  }

  return (
    <Card className="bg-transparent border border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Coins className="h-5 w-5 text-yellow-400" />
              Utilizare Token-uri AI
            </CardTitle>
            <CardDescription className="text-slate-400 mt-1">
              Urmărire token-uri folosite în generatorul de descrieri
            </CardDescription>
          </div>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Toți agenții" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white hover:bg-slate-700">
                Toți agenții
              </SelectItem>
              {stats.map((stat) => (
                <SelectItem 
                  key={stat.agentId} 
                  value={stat.agentId.toString()}
                  className="text-white hover:bg-slate-700"
                >
                  {stat.agentName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-slate-400">Total Token-uri</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(totalTokens)}</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-slate-400">Cost Total (RON)</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatCost(totalCost)} RON</p>
              </div>
            </div>

            {/* Agent List */}
            {filteredStats.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                Nu există date de utilizare token-uri
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredStats.map((stat) => (
                  <div
                    key={stat.agentId}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{stat.agentName}</h4>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{formatNumber(stat.totalTokens)} token-uri</span>
                          <span>•</span>
                          <span>{stat.usageCount} utilizări</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-yellow-400">
                          {formatCost(stat.totalCostRON)} RON
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

