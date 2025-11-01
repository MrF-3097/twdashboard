import { Home, ListChecks } from 'lucide-react';

export function TransactionStats() {
  return (
    <div className="mx-5 mb-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center">
              <Home size={18} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h4 className="text-[24px] font-bold text-[#0F172A] mb-1">37</h4>
          <p className="text-[11px] text-[#64748B] mb-0.5">Tranzacții totale</p>
          <p className="text-[10px] text-[#94A3B8]">de la intrarea în agenție</p>
        </div>

        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EC4899] to-[#F472B6] flex items-center justify-center">
              <ListChecks size={18} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h4 className="text-[24px] font-bold text-[#0F172A] mb-1">5</h4>
          <p className="text-[11px] text-[#64748B] mb-0.5">Listing-uri active</p>
          <p className="text-[10px] text-[#94A3B8]">în portofoliul tău</p>
        </div>
      </div>
    </div>
  );
}
