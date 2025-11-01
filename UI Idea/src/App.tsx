import { useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/screens/HomeScreen';
import { ToolsScreen } from './components/screens/ToolsScreen';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { AgentSwitchScreen } from './components/screens/AgentSwitchScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'tools' | 'leaderboard' | 'profile'>('home');
  const [showAgentSwitch, setShowAgentSwitch] = useState(false);

  const renderScreen = () => {
    if (showAgentSwitch) {
      return <AgentSwitchScreen onClose={() => setShowAgentSwitch(false)} />;
    }

    switch (activeTab) {
      case 'home':
        return <HomeScreen onSwitchProfile={() => setShowAgentSwitch(true)} />;
      case 'tools':
        return <ToolsScreen />;
      case 'leaderboard':
        return <LeaderboardScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen onSwitchProfile={() => setShowAgentSwitch(true)} />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#E2E8F0] p-4">
      {/* iPhone 15 Pro Frame - 390x844 */}
      <div className="relative w-[390px] h-[844px] bg-white rounded-[40px] shadow-2xl overflow-hidden border-[8px] border-[#1E293B]">
        {/* Dynamic Island */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-[#000000] rounded-b-[20px] z-50" />
        
        {/* Screen Content */}
        <div className="h-full overflow-hidden bg-[#F8FAFC]">
          {renderScreen()}
        </div>

        {/* Bottom Navigation - Only show when not in agent switch screen */}
        {!showAgentSwitch && (
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        )}
      </div>
    </div>
  );
}
