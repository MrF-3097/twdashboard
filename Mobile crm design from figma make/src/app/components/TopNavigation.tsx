import { Search, SlidersHorizontal, Bell, Plus, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useState } from "react";

export function TopNavigation() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, type: "urgent", message: "Contract deadline: Maria Garcia - 3:00 PM today", time: "10 min ago" },
    { id: 2, type: "info", message: "New lead assigned: Modern Villa", time: "1 hour ago" },
    { id: 3, type: "success", message: "Deal closed: $1.2M Downtown Condo", time: "2 hours ago" },
  ];

  const unreadCount = notifications.length;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border/50 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <h1 className="text-foreground text-lg leading-none">RealEstate CRM</h1>
            <p className="text-xs text-muted-foreground">Agent Dashboard</p>
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search clients, leads, properties..."
              className="w-full pl-12 pr-12 py-3 bg-secondary/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-white transition-all"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-secondary/50 rounded-lg transition-colors">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Right: Actions & User */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 hover:bg-secondary/50 rounded-xl transition-colors"
            >
              <Bell className="h-5 w-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-border/30">
                  <h3 className="text-sm text-foreground">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="px-4 py-3 hover:bg-secondary/30 border-b border-border/20 transition-colors cursor-pointer">
                      <p className="text-sm text-foreground mb-1">{notif.message}</p>
                      <p className="text-xs text-muted-foreground">{notif.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 text-center border-t border-border/30">
                  <button className="text-sm text-primary hover:text-primary/80 transition-colors">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Add */}
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="h-4 w-4" />
            <span className="text-sm">Quick Add</span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 pr-3 hover:bg-secondary/50 rounded-xl transition-colors"
            >
              <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" alt="Agent" />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                  JD
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-border/30">
                  <p className="text-sm text-foreground">John Doe</p>
                  <p className="text-xs text-muted-foreground">Senior Agent</p>
                </div>
                <div className="py-2">
                  <button className="w-full px-4 py-2 text-sm text-foreground hover:bg-secondary/30 text-left transition-colors">
                    Profile Settings
                  </button>
                  <button className="w-full px-4 py-2 text-sm text-foreground hover:bg-secondary/30 text-left transition-colors">
                    Preferences
                  </button>
                  <button className="w-full px-4 py-2 text-sm text-foreground hover:bg-secondary/30 text-left transition-colors">
                    Help & Support
                  </button>
                </div>
                <div className="border-t border-border/30">
                  <button className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 text-left transition-colors">
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
