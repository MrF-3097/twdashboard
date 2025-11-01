import { Badge } from './ui/badge';

export function YTDCard() {
  const ytdAmount = 84250;
  const annualTarget = 120000;
  const percentageOfTarget = ((ytdAmount / annualTarget) * 100).toFixed(0);

  return (
    <div className="mx-5 mb-4">
      <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[13px] text-[#64748B] mb-2">Total comisioane YTD</p>
            <h3 className="text-[28px] font-bold text-[#0F172A] mb-1">€{ytdAmount.toLocaleString('ro-RO')}</h3>
            <p className="text-[12px] text-[#94A3B8]">
              Țintă anuală: €{annualTarget.toLocaleString('ro-RO')} ({percentageOfTarget}%)
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="bg-[#F1F5F9] text-[#475569] text-[11px] px-2 py-0.5">
              An curent
            </Badge>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#6366F1] text-white text-[14px] font-bold">
              {percentageOfTarget}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
