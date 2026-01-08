import { Home, BarChart3, Users, User } from "lucide-react";
import { useState } from "react";

export function BottomNavigation() {
  const [activeTab, setActiveTab] = useState("home");

  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "dashboard", icon: BarChart3, label: "Dashboard" },
    { id: "clients", icon: Users, label: "Clients" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border/50 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all duration-200 ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <tab.icon className={`h-6 w-6 transition-transform ${activeTab === tab.id ? "scale-110" : ""}`} />
                {activeTab === tab.id && (
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"></span>
                )}
              </div>
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
