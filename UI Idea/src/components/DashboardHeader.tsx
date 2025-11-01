import { ArrowLeftRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface DashboardHeaderProps {
  onSwitchProfile: () => void;
}

export function DashboardHeader({ onSwitchProfile }: DashboardHeaderProps) {
  const currentDate = new Date().toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="px-5 pt-6 pb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-white shadow-md">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
            <AvatarFallback>AM</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-[17px] font-semibold text-[#0F172A]">Alex Munteanu</h1>
            <p className="text-[13px] text-[#64748B]">Broker Associate</p>
          </div>
        </div>
        
        <button
          onClick={onSwitchProfile}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] rounded-full border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors"
        >
          <ArrowLeftRight size={14} className="text-[#64748B]" />
          <span className="text-[12px] font-semibold text-[#475569]">Schimbă</span>
        </button>
      </div>
      
      <p className="text-[11px] text-[#94A3B8]">
        Ultima actualizare: {currentDate}
      </p>
    </div>
  );
}
