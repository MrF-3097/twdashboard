'use client'

import { TrendingUp } from 'lucide-react'

interface CommissionChartProps {
  monthlyData?: Array<{ month: string; amount: number }>
}

export const CommissionChart = ({ 
  monthlyData = [
    { month: 'Ian', amount: 8500 },
    { month: 'Feb', amount: 9200 },
    { month: 'Mar', amount: 7800 },
    { month: 'Apr', amount: 10500 },
    { month: 'Mai', amount: 11200 },
    { month: 'Iun', amount: 12480 },
  ]
}: CommissionChartProps) => {
  const maxAmount = Math.max(...monthlyData.map(d => d.amount))
  const currentMonth = monthlyData[monthlyData.length - 1]
  const previousMonth = monthlyData[monthlyData.length - 2]
  const percentageChange = previousMonth ? ((currentMonth.amount - previousMonth.amount) / previousMonth.amount * 100).toFixed(0) : '0'

  return (
    <div className="mx-5 mb-4">
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] p-6 shadow-xl">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-semibold text-white">Evoluția comisioanelor</h3>
              <p className="text-[12px] text-[#CBD5E1]">Ultimele 6 luni</p>
            </div>
            <div className="flex items-center gap-1 bg-[#10B981]/20 px-2 py-1 rounded-md">
              <TrendingUp size={12} className="text-[#34D399]" />
              <span className="text-[11px] font-semibold text-[#34D399]">+{percentageChange}%</span>
            </div>
          </div>
          
          <div className="flex items-end justify-between h-24 gap-1">
            {monthlyData.map((data, index) => {
              const height = (data.amount / maxAmount) * 100
              const isCurrentMonth = index === monthlyData.length - 1
              
              return (
                <div key={data.month} className="flex flex-col items-center flex-1">
                  <div className="relative w-full flex justify-center">
                    <div 
                      className={`w-6 rounded-t-md transition-all duration-500 ${
                        isCurrentMonth 
                          ? 'bg-gradient-to-t from-[#34D399] to-[#10B981]' 
                          : 'bg-gradient-to-t from-white/30 to-white/50'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    {isCurrentMonth && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded">
                        €{data.amount.toLocaleString('ro-RO')}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-[#CBD5E1] mt-2">{data.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

