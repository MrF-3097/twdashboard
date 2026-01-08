import { Bell, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function DashboardHeader() {
  return (
    <header className="bg-white border-b border-border/50 px-6 py-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary/10">
            <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" alt="Alexandra" />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">AS</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-muted-foreground text-sm">Welcome,</p>
            <h2 className="text-foreground">Alexandra Silva</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                Online
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">Senior Agent</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2.5 rounded-full hover:bg-secondary/50 transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive"></span>
          </button>
          <button className="p-2.5 rounded-full hover:bg-secondary/50 transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
