import { TrendingUp } from 'lucide-react';
import { Progress } from './ui/progress';

export function MonthlyKPICard() {
  const currentAmount = 12480;
  const previousAmount = 11143;
  const targetAmount = 16000;
  const percentageChange = ((currentAmount - previousAmount) / previousAmount * 100).toFixed(0);
  const progressToTarget = (currentAmount / targetAmount * 100);

  return (
    <div className="mx-5 mb-4">
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#4F46E5] p-6 shadow-xl">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.3),transparent_50%)]" />
        
        <div className="relative z-10">
          <p className="text-[13px] text-[#CBD5E1] mb-2">Comision generat luna aceasta</p>
          
          <div className="flex items-baseline gap-2 mb-2">
            <h2 className="text-[32px] font-bold text-white">€{currentAmount.toLocaleString('ro-RO')}</h2>
            <div className="flex items-center gap-1 bg-[#10B981]/20 px-2 py-0.5 rounded-md">
              <TrendingUp size={12} className="text-[#34D399]" />
              <span className="text-[12px] font-semibold text-[#34D399]">+{percentageChange}%</span>
            </div>
          </div>
          
          <p className="text-[12px] text-[#94A3B8] mb-4">față de luna trecută</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#CBD5E1]">{progressToTarget.toFixed(0)}% din obiectiv</span>
              <span className="text-[#E2E8F0] font-semibold">€{targetAmount.toLocaleString('ro-RO')}</span>
            </div>
            <Progress value={progressToTarget} className="h-2 bg-white/20" indicatorClassName="bg-gradient-to-r from-[#34D399] to-[#10B981]" />
          </div>
        </div>
      </div>
    </div>
  );
}
