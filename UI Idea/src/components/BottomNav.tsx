import { Home, Wrench, TrendingUp, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'tools' | 'leaderboard' | 'profile';
  onTabChange: (tab: 'home' | 'tools' | 'leaderboard' | 'profile') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Acasă' },
    { id: 'tools', icon: Wrench, label: 'Instrumente' },
    { id: 'leaderboard', icon: TrendingUp, label: 'Clasament' },
    { id: 'profile', icon: User, label: 'Profil' },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[16px] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 pt-3 pb-6 z-50">
      <div className="flex items-center justify-around max-w-[390px] mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as any)}
              className="flex flex-col items-center gap-1 min-w-[60px] transition-all"
            >
              <Icon
                className={`transition-colors ${
                  isActive ? 'text-[#4F46E5]' : 'text-[#9CA3AF]'
                }`}
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                fill={isActive ? '#4F46E5' : 'none'}
              />
              <span
                className={`text-[11px] font-semibold transition-colors ${
                  isActive ? 'text-[#4F46E5]' : 'text-[#9CA3AF]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
