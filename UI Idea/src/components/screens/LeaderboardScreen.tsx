import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

export function LeaderboardScreen() {
  const topAgents = [
    { rank: 1, name: 'Maria Popescu', transactions: 142, commission: 425000, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', initials: 'MP' },
    { rank: 2, name: 'Ion Georgescu', transactions: 128, commission: 398000, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', initials: 'IG' },
    { rank: 3, name: 'Elena Dumitrescu', transactions: 115, commission: 362000, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', initials: 'ED' },
    { rank: 4, name: 'Andrei Constantinescu', transactions: 98, commission: 289000, avatar: 'https://images.unsplash.com/photo-1500648067791-00dcc994a43e?w=100&h=100&fit=crop', initials: 'AC' },
    { rank: 5, name: 'Ana Moldovan', transactions: 87, commission: 254000, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', initials: 'AM' },
    { rank: 6, name: 'Alex Munteanu', transactions: 37, commission: 84250, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', initials: 'AM', isCurrentUser: true },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-[#FFD700]" size={20} />;
    if (rank === 2) return <Medal className="text-[#C0C0C0]" size={20} />;
    if (rank === 3) return <Award className="text-[#CD7F32]" size={20} />;
    return null;
  };

  return (
    <div className="h-full overflow-y-auto pb-24 bg-[#F8FAFC]">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[24px] font-bold text-[#0F172A] mb-2">Clasament</h1>
        <p className="text-[14px] text-[#64748B]">Top agenți după performanță YTD</p>
      </div>

      <div className="px-5 mb-4">
        <div className="bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-[16px] p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] text-white/80 mb-1">Poziția ta curentă</p>
              <h2 className="text-[32px] font-bold">#6</h2>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp size={32} className="text-white" />
            </div>
          </div>
          <p className="text-[12px] text-white/90">
            Mai ai nevoie de <span className="font-bold">€169.750</span> pentru Top 5
          </p>
        </div>
      </div>

      <div className="px-5 space-y-3">
        {topAgents.map((agent) => (
          <div
            key={agent.rank}
            className={`bg-white rounded-[16px] border ${
              agent.isCurrentUser ? 'border-[#4F46E5] ring-2 ring-[#4F46E5]/20' : 'border-[#E2E8F0]'
            } p-4 shadow-sm`}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 text-[18px] font-bold text-[#64748B]">
                {getRankIcon(agent.rank) || `#${agent.rank}`}
              </div>

              <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                <AvatarImage src={agent.avatar} />
                <AvatarFallback>{agent.initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[14px] font-semibold text-[#0F172A]">{agent.name}</h3>
                  {agent.isCurrentUser && (
                    <Badge variant="secondary" className="bg-[#4F46E5] text-white text-[10px] px-1.5 py-0">Tu</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                  <span>{agent.transactions} tranzacții</span>
                  <span>•</span>
                  <span className="font-semibold text-[#0F172A]">€{agent.commission.toLocaleString('ro-RO')}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
