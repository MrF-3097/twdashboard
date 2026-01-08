import { TrendingUp, Home } from "lucide-react";

export function HeroCard() {
  return (
    <div className="relative bg-gradient-to-br from-blue-50 via-blue-100/50 to-indigo-50 rounded-3xl p-8 overflow-hidden shadow-sm border border-blue-100/50">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-200/20 rounded-full blur-3xl"></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-6">
          <div className="p-3 bg-white rounded-2xl shadow-sm">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs text-green-700">+12% this month</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-5xl text-foreground tracking-tight">24</h1>
          <p className="text-muted-foreground">Active Listings</p>
          <p className="text-sm text-muted-foreground/80">8 properties closing this week</p>
        </div>
      </div>
    </div>
  );
}
