import { Home, Users, Plus, Building2, Trophy } from "lucide-react";
import { useState } from "react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const [pressedTab, setPressedTab] = useState<string | null>(null);

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "clients", label: "Clients", icon: Users },
    { id: "add", label: "Add", icon: Plus, isPrimary: true },
    { id: "properties", label: "Properties", icon: Building2 },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  const handleTabPress = (tabId: string) => {
    setPressedTab(tabId);
    setTimeout(() => setPressedTab(null), 150);
    onTabChange(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border/50 shadow-2xl z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isPressed = pressedTab === tab.id;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => handleTabPress(tab.id)}
                className={`flex flex-col items-center justify-center transition-all duration-200 ${
                  isPressed ? "scale-90 opacity-80" : "scale-100"
                }`}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg -mt-6 border-4 border-white">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-primary mt-1">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all duration-200 ${
                isPressed ? "scale-90 opacity-80" : "scale-100"
              } ${isActive ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "text-primary" : ""}`} />
              <span className="text-xs">{tab.label}</span>
              {isActive && (
                <div className="w-1 h-1 bg-primary rounded-full animate-in fade-in zoom-in duration-200"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
