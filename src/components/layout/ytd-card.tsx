'use client'

interface YTDCardProps {
  ytdAmount?: number
  annualTarget?: number
}

export const YTDCard = ({ 
  ytdAmount = 84250, 
  annualTarget = 120000 
}: YTDCardProps) => {
  const percentageOfTarget = ((ytdAmount / annualTarget) * 100).toFixed(0)

  return (
    <div className="mx-4 mb-4">
      {/* Dark secondary card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-800 border border-slate-700 p-6 shadow-lg">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-600/20 via-transparent to-blue-600/20" />
        
        <div className="relative z-10">
          <p className="text-sm text-slate-400 mb-3 font-medium">Total comisioane YTD</p>
          
          <div className="flex items-baseline gap-2 mb-2">
            <h2 className="text-[36px] font-black text-white tracking-tight">€{ytdAmount.toLocaleString('ro-RO')}</h2>
            <div className="flex items-center gap-1 bg-gradient-to-r from-slate-600 to-blue-600 px-3 py-1 rounded-full shadow-sm">
              <span className="text-xs font-bold text-white">{percentageOfTarget}%</span>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 mb-5 font-medium">din ținta anuală de €{annualTarget.toLocaleString('ro-RO')}</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400">Progres anual</span>
              <span className="text-white font-bold">{percentageOfTarget}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-700 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-slate-600 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(parseInt(percentageOfTarget), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

