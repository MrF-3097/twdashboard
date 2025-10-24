'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Star, TrendingUp, Award, Calendar, BarChart3 } from 'lucide-react'
import { GamifiedLeaderboard } from '@/components/modules/leaderboard/gamified-leaderboard'

interface ProfilePageProps {
  onBack: () => void
  agentData: any
}

export const ProfilePage = ({ onBack, agentData }: ProfilePageProps) => {
  // Use actual agent data from login
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('ro-RO', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  // Calculate mock stats based on agent ID (deterministic)
  const agentId = agentData?.id || 1
  const transactions = Math.floor((agentId * 7) % 20) + 5
  const currentMonthCommission = Math.floor((agentId * 1234) % 25000) + 5000
  const totalCommission = Math.floor((agentId * 9876) % 200000) + 50000
  const rating = 3.5 + ((agentId * 13) % 15) / 10
  const ranking = (agentId % 25) + 1

  const userData = {
    name: agentData?.name || 'Agent Necunoscut',
    email: agentData?.email || 'agent@towerimob.ro',
    image: agentData?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${agentData?.id || 'default'}`,
    joinedDate: formatDate(agentData?.created_at),
    rating: Math.min(5, Math.max(3.5, rating)),
    seniority: agentData?.position || 'Agent Imobiliar',
    ranking: ranking,
    totalAgents: 25,
    transactions: transactions,
    currentMonthCommission: currentMonthCommission,
    totalCommission: totalCommission,
  }

  // Yearly data for chart
  const yearlyData = [
    { month: 'Ian', commission: 8500 },
    { month: 'Feb', commission: 12000 },
    { month: 'Mar', commission: 15000 },
    { month: 'Apr', commission: 11000 },
    { month: 'Mai', commission: 14500 },
    { month: 'Iun', commission: 16000 },
    { month: 'Iul', commission: 13500 },
    { month: 'Aug', commission: 17000 },
    { month: 'Sep', commission: 14000 },
    { month: 'Oct', commission: 15000 },
    { month: 'Nov', commission: 0 },
    { month: 'Dec', commission: 0 },
  ]

  const maxCommission = Math.max(...yearlyData.map(d => d.commission))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 animate-in fade-in-0 duration-500">
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-6 hover:bg-primary/10 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Înapoi la Dashboard
        </Button>

        {/* Profile Header Card */}
        <Card className="mb-6 overflow-hidden border-2 shadow-xl animate-in slide-in-from-top-4 duration-700">
          <div className="h-16 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 relative">
            {/* Ranking Badge in top right of gradient */}
            <div className="absolute top-2 right-3 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full px-3 py-1 text-sm font-bold shadow-lg">
              #{userData.ranking}/{userData.totalAgents}
            </div>
          </div>
          <CardContent className="relative pt-0 pb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 -mt-8 pt-4">
              {/* Profile Image - Fixed aspect ratio */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-full border-4 border-background shadow-2xl bg-white overflow-hidden">
                  <img
                    src={userData.image}
                    alt={userData.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left mt-4 pt-[10px] w-full">
                <h1 className="text-xl md:text-2xl font-bold mb-2 break-words px-4 md:px-0">{userData.name}</h1>
                <p className="text-muted-foreground mb-4 text-xs md:text-sm break-all px-4 md:px-0">{userData.email}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start px-4 md:px-0">
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                    <Star className="h-3 w-3 text-yellow-600 fill-yellow-600" />
                    <span className="font-semibold text-yellow-900 dark:text-yellow-100 text-xs">{userData.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-full max-w-[180px]">
                    <Award className="h-3 w-3 text-blue-600 flex-shrink-0" />
                    <span className="font-semibold text-blue-900 dark:text-blue-100 text-xs truncate">{userData.seniority}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 rounded-full">
                    <Calendar className="h-3 w-3 text-green-600 flex-shrink-0" />
                    <span className="font-semibold text-green-900 dark:text-green-100 text-xs whitespace-nowrap">Din {userData.joinedDate}</span>
                  </div>
                </div>
              </div>

              {/* Ranking Badge - Desktop Only */}
              <div className="hidden md:flex flex-col items-center justify-center px-4 py-3 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900 dark:to-amber-900 rounded-lg border-2 border-yellow-200 dark:border-yellow-700 shadow-lg">
                <TrendingUp className="h-5 w-5 mb-1 text-yellow-600" />
                <p className="text-xs text-muted-foreground">Clasament</p>
                <p className="text-xl font-bold text-yellow-600">#{userData.ranking}</p>
                <p className="text-xs text-muted-foreground">din {userData.totalAgents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Tranzacții */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in slide-in-from-bottom-4 duration-700 delay-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                Tranzacții
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">{userData.transactions}</p>
              <p className="text-sm text-muted-foreground mt-2">Tranzacții finalizate</p>
            </CardContent>
          </Card>

          {/* Comision Luna Curentă */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                Comision Octombrie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">{formatCurrency(userData.currentMonthCommission)} €</p>
              <p className="text-sm text-muted-foreground mt-2">Luna curentă</p>
            </CardContent>
          </Card>

          {/* Comision Total */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in slide-in-from-bottom-4 duration-700 delay-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
                Comision Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-600">{formatCurrency(userData.totalCommission)} €</p>
              <p className="text-sm text-muted-foreground mt-2">Total acumulat</p>
            </CardContent>
          </Card>
        </div>

        {/* Yearly Commission Chart */}
        <Card className="mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Evoluție Comision 2025
            </CardTitle>
            <CardDescription>Comision generat pe fiecare lună (EUR)</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mobile: Horizontal scrollable chart */}
            <div className="md:hidden">
              <div className="relative h-64 overflow-x-auto">
                <div className="w-[600px] h-full pt-4">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(maxCommission)} €</span>
                    <span>{formatCurrency(maxCommission * 0.75)} €</span>
                    <span>{formatCurrency(maxCommission * 0.5)} €</span>
                    <span>{formatCurrency(maxCommission * 0.25)} €</span>
                    <span>0 €</span>
                  </div>

                  {/* Chart area */}
                  <div className="ml-12 h-full relative">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-full border-t border-muted/30" />
                      ))}
                    </div>

                    {/* SVG Chart */}
                    <svg className="w-full h-full" viewBox="0 0 600 300" preserveAspectRatio="none">
                      <defs>
                        {/* Gradient fill */}
                        <linearGradient id="chartGradientMobile" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="rgb(234, 179, 8)" stopOpacity="0.5" />
                          <stop offset="50%" stopColor="rgb(245, 158, 11)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="rgb(202, 138, 4)" stopOpacity="0.1" />
                        </linearGradient>
                        
                        {/* Line gradient */}
                        <linearGradient id="lineGradientMobile" x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0%" stopColor="rgb(234, 179, 8)" />
                          <stop offset="50%" stopColor="rgb(245, 158, 11)" />
                          <stop offset="100%" stopColor="rgb(202, 138, 4)" />
                        </linearGradient>
                      </defs>

                      {/* Area under the line */}
                      <path
                        d={`M ${yearlyData
                          .map((data, index) => {
                            const x = (index / (yearlyData.length - 1)) * 600
                            const y = 300 - (data.commission / maxCommission) * 300
                            return `${x},${y}`
                          })
                          .join(' L ')} L 600,300 L 0,300 Z`}
                        fill="url(#chartGradientMobile)"
                        className="animate-in fade-in-0 duration-1000"
                        style={{ animation: 'fadeIn 1s ease-out 0.5s backwards' }}
                      />

                      {/* Line */}
                      <polyline
                        points={yearlyData
                          .map((data, index) => {
                            const x = (index / (yearlyData.length - 1)) * 600
                            const y = 300 - (data.commission / maxCommission) * 300
                            return `${x},${y}`
                          })
                          .join(' ')}
                        fill="none"
                        stroke="url(#lineGradientMobile)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                        style={{
                          filter: 'drop-shadow(0 4px 6px rgba(234, 179, 8, 0.3))',
                          strokeDasharray: '2000',
                          strokeDashoffset: '2000',
                          animation: 'drawLine 2s ease-out 0.5s forwards'
                        }}
                      />

                      {/* Data points */}
                      {yearlyData.map((data, index) => {
                        const x = (index / (yearlyData.length - 1)) * 600
                        const y = 300 - (data.commission / maxCommission) * 300
                        const isCurrentMonth = index === 9 // October
                        
                        return (
                          <g key={index}>
                            <circle
                              cx={x}
                              cy={y}
                              r={isCurrentMonth ? "8" : "5"}
                              fill={isCurrentMonth ? "rgb(34, 197, 94)" : "white"}
                              stroke={isCurrentMonth ? "rgb(34, 197, 94)" : "url(#lineGradientMobile)"}
                              strokeWidth="2"
                              className="cursor-pointer hover:r-8 transition-all"
                              style={{
                                filter: isCurrentMonth ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                                animation: `popIn 0.3s ease-out ${index * 0.1 + 0.5}s backwards`
                              }}
                            >
                              <title>{data.month}: {formatCurrency(data.commission)} €</title>
                            </circle>
                          </g>
                        )
                      })}
                    </svg>

                    {/* X-axis labels - Mobile: 2-letter month names */}
                    <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-1">
                      {yearlyData.map((data, index) => (
                        <span
                          key={data.month}
                          className={`text-xs font-medium ${index === 9 ? 'text-green-600 font-bold' : 'text-muted-foreground'}`}
                        >
                          {data.month.substring(0, 2)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: Original chart */}
            <div className="hidden md:block relative h-80 pt-4">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(maxCommission)} €</span>
                <span>{formatCurrency(maxCommission * 0.75)} €</span>
                <span>{formatCurrency(maxCommission * 0.5)} €</span>
                <span>{formatCurrency(maxCommission * 0.25)} €</span>
                <span>0 €</span>
              </div>

              {/* Chart area */}
              <div className="ml-16 h-full relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full border-t border-muted/30" />
                  ))}
                </div>

                {/* SVG Chart */}
                <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                  <defs>
                    {/* Gradient fill */}
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgb(234, 179, 8)" stopOpacity="0.5" />
                      <stop offset="50%" stopColor="rgb(245, 158, 11)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="rgb(202, 138, 4)" stopOpacity="0.1" />
                    </linearGradient>
                    
                    {/* Line gradient */}
                    <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="rgb(234, 179, 8)" />
                      <stop offset="50%" stopColor="rgb(245, 158, 11)" />
                      <stop offset="100%" stopColor="rgb(202, 138, 4)" />
                    </linearGradient>
                  </defs>

                  {/* Area under the line */}
                  <path
                    d={`M ${yearlyData
                      .map((data, index) => {
                        const x = (index / (yearlyData.length - 1)) * 1000
                        const y = 300 - (data.commission / maxCommission) * 300
                        return `${x},${y}`
                      })
                      .join(' L ')} L 1000,300 L 0,300 Z`}
                    fill="url(#chartGradient)"
                    className="animate-in fade-in-0 duration-1000"
                    style={{ animation: 'fadeIn 1s ease-out 0.5s backwards' }}
                  />

                  {/* Line */}
                  <polyline
                    points={yearlyData
                      .map((data, index) => {
                        const x = (index / (yearlyData.length - 1)) * 1000
                        const y = 300 - (data.commission / maxCommission) * 300
                        return `${x},${y}`
                      })
                      .join(' ')}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                    style={{
                      filter: 'drop-shadow(0 4px 6px rgba(234, 179, 8, 0.3))',
                      strokeDasharray: '2000',
                      strokeDashoffset: '2000',
                      animation: 'drawLine 2s ease-out 0.5s forwards'
                    }}
                  />

                  {/* Data points */}
                  {yearlyData.map((data, index) => {
                    const x = (index / (yearlyData.length - 1)) * 1000
                    const y = 300 - (data.commission / maxCommission) * 300
                    const isCurrentMonth = index === 9 // October
                    
                    return (
                      <g key={index}>
                        <circle
                          cx={x}
                          cy={y}
                          r={isCurrentMonth ? "8" : "5"}
                          fill={isCurrentMonth ? "rgb(34, 197, 94)" : "white"}
                          stroke={isCurrentMonth ? "rgb(34, 197, 94)" : "url(#lineGradient)"}
                          strokeWidth="2"
                          className="cursor-pointer hover:r-8 transition-all"
                          style={{
                            filter: isCurrentMonth ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                            animation: `popIn 0.3s ease-out ${index * 0.1 + 0.5}s backwards`
                          }}
                        >
                          <title>{data.month}: {formatCurrency(data.commission)} €</title>
                        </circle>
                      </g>
                    )
                  })}
                </svg>

                {/* X-axis labels - Desktop: Full month names */}
                <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-1">
                  {yearlyData.map((data, index) => (
                    <span
                      key={data.month}
                      className={`text-xs font-medium ${index === 9 ? 'text-green-600 font-bold' : 'text-muted-foreground'}`}
                    >
                      {data.month}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-500">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Clasament Agenți
              </CardTitle>
              <CardDescription>Top performeri din agenție</CardDescription>
            </CardHeader>
            <CardContent>
              <GamifiedLeaderboard />
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes popIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

