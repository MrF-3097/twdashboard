import { Check, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface AgentSwitchScreenProps {
  onClose: () => void;
}

export function AgentSwitchScreen({ onClose }: AgentSwitchScreenProps) {
  const agents = [
    {
      id: 1,
      name: 'Alex Munteanu',
      role: 'Broker Associate',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      initials: 'AM',
      isActive: true,
      transactions: 37,
      commission: 84250,
    },
    {
      id: 2,
      name: 'Diana Ionescu',
      role: 'Team Lead',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
      initials: 'DI',
      isActive: false,
      transactions: 52,
      commission: 156000,
    },
    {
      id: 3,
      name: 'Mihai Popescu',
      role: 'Senior Broker',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
      initials: 'MP',
      isActive: false,
      transactions: 68,
      commission: 204000,
    },
  ];

  return (
    <div className="h-full bg-[#F8FAFC]">
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[#E2E8F0]">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[24px] font-bold text-[#0F172A]">Schimbă profil</h1>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors"
          >
            <X size={18} className="text-[#64748B]" />
          </button>
        </div>
        <p className="text-[14px] text-[#64748B]">
          Selectează profilul de agent pe care vrei să-l vizualizezi
        </p>
      </div>

      <div className="px-5 pt-6 space-y-3 pb-24">
        {agents.map((agent) => (
          <button
            key={agent.id}
            className={`w-full bg-white rounded-[16px] border-2 ${
              agent.isActive ? 'border-[#4F46E5]' : 'border-[#E2E8F0]'
            } p-5 shadow-sm hover:shadow-md transition-all`}
          >
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                <AvatarImage src={agent.avatar} />
                <AvatarFallback>{agent.initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[16px] font-semibold text-[#0F172A]">{agent.name}</h3>
                  {agent.isActive && (
                    <div className="w-5 h-5 rounded-full bg-[#4F46E5] flex items-center justify-center">
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-[13px] text-[#64748B] mb-3">{agent.role}</p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="bg-[#F1F5F9] text-[#475569] text-[10px] px-2 py-0.5">
                      {agent.transactions} tranzacții
                    </Badge>
                  </div>
                  <div className="text-[12px] text-[#0F172A] font-semibold">
                    €{agent.commission.toLocaleString('ro-RO')} YTD
                  </div>
                </div>
              </div>
            </div>

            {agent.isActive && (
              <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
                <p className="text-[11px] text-[#4F46E5] font-semibold">Profil activ curent</p>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] px-5 py-4">
        <p className="text-[11px] text-[#64748B] text-center">
          Dashboard-ul va afișa datele profilului selectat
        </p>
      </div>
    </div>
  );
}
