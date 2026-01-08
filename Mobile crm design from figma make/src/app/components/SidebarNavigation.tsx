import { Home, Users, Building2, UserPlus, Calendar, CheckSquare, BarChart3, Settings } from "lucide-react";
import { useState } from "react";

export function SidebarNavigation() {
  const [activeItem, setActiveItem] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "clients", label: "Clients", icon: Users },
    { id: "properties", label: "Properties", icon: Building2 },
    { id: "leads", label: "Leads", icon: UserPlus },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-[73px] bottom-0 w-64 bg-white border-r border-border/50 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-blue-50 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Stats in Sidebar */}
      <div className="px-4 py-6 border-t border-border/30 mt-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Quick Stats</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Active Deals</span>
            <span className="text-sm text-foreground">12</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Hot Leads</span>
            <span className="text-sm text-orange-600">8</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">This Month</span>
            <span className="text-sm text-green-600">$3.2M</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
