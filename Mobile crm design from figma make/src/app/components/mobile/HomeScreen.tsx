import { 
  Phone, Mail, Calendar, AlertCircle, TrendingUp, 
  UserPlus, Building2, CheckCircle, ArrowRight, Flame 
} from "lucide-react";
import { useState, useEffect } from "react";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const priorities = [
    {
      id: "1",
      type: "follow-up",
      title: "Follow up: James Anderson",
      subtitle: "Viewed Modern Villa twice - high interest",
      urgency: "high",
      time: "2 hours overdue",
      icon: Phone,
      color: "bg-red-50 border-red-200"
    },
    {
      id: "2",
      type: "meeting",
      title: "Property viewing: Maria Garcia",
      subtitle: "Downtown Condo at 3:00 PM",
      urgency: "medium",
      time: "Today 3:00 PM",
      icon: Calendar,
      color: "bg-orange-50 border-orange-200"
    },
    {
      id: "3",
      type: "lead",
      title: "New lead: Robert Chen",
      subtitle: "Looking for suburban properties",
      urgency: "low",
      time: "1 hour ago",
      icon: UserPlus,
      color: "bg-blue-50 border-blue-200"
    }
  ];

  const todayStats = {
    clientsAdded: 3,
    propertiesAdded: 5,
    dealsClosed: 1
  };

  const weekStats = {
    clientsAdded: 12,
    propertiesAdded: 18,
    dealsClosed: 4
  };

  return (
    <div className="pb-24 pt-4 px-4 space-y-6">
      {/* Header */}
      <div className={`animate-in slide-in-from-top-4 duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className="text-2xl text-foreground mb-1">Good Morning, John 👋</h1>
        <p className="text-sm text-muted-foreground">Here's what needs your attention</p>
      </div>

      {/* Quick Stats */}
      <div className={`grid grid-cols-3 gap-3 animate-in slide-in-from-top-5 duration-500 delay-100 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-4 border border-green-200/50">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs text-green-700 uppercase tracking-wide">Today</span>
          </div>
          <p className="text-2xl text-green-700 mb-1">{todayStats.dealsClosed}</p>
          <p className="text-xs text-green-600">Deal closed</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-200/50">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-blue-700 uppercase tracking-wide">Today</span>
          </div>
          <p className="text-2xl text-blue-700 mb-1">{todayStats.clientsAdded}</p>
          <p className="text-xs text-blue-600">Clients added</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4 border border-purple-200/50">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-purple-700 uppercase tracking-wide">Today</span>
          </div>
          <p className="text-2xl text-purple-700 mb-1">{todayStats.propertiesAdded}</p>
          <p className="text-xs text-purple-600">Properties</p>
        </div>
      </div>

      {/* Week Performance */}
      <div className={`bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200/50 animate-in slide-in-from-top-6 duration-500 delay-150 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm text-foreground">This Week</h3>
            <p className="text-xs text-muted-foreground">You're on fire!</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-xl text-foreground mb-0.5">{weekStats.clientsAdded}</p>
            <p className="text-xs text-muted-foreground">Clients</p>
          </div>
          <div className="text-center">
            <p className="text-xl text-foreground mb-0.5">{weekStats.propertiesAdded}</p>
            <p className="text-xs text-muted-foreground">Properties</p>
          </div>
          <div className="text-center">
            <p className="text-xl text-foreground mb-0.5">{weekStats.dealsClosed}</p>
            <p className="text-xs text-muted-foreground">Deals</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`space-y-3 animate-in slide-in-from-top-7 duration-500 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-lg text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate("add-client")}
            className="bg-white border-2 border-primary/20 rounded-2xl p-5 hover:border-primary/40 active:scale-95 transition-all duration-200 text-left shadow-sm"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm text-foreground mb-1">Add Client</h3>
            <p className="text-xs text-muted-foreground">Buyer or renter</p>
          </button>

          <button
            onClick={() => onNavigate("add-property")}
            className="bg-white border-2 border-purple-200/50 rounded-2xl p-5 hover:border-purple-300 active:scale-95 transition-all duration-200 text-left shadow-sm"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
              <Building2 className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-sm text-foreground mb-1">Add Property</h3>
            <p className="text-xs text-muted-foreground">House or apartment</p>
          </button>
        </div>
      </div>

      {/* Priority List */}
      <div className={`space-y-3 animate-in slide-in-from-top-8 duration-500 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-foreground">Your Priorities</h2>
          <span className="text-xs text-muted-foreground">{priorities.length} items</span>
        </div>

        <div className="space-y-3">
          {priorities.map((priority, index) => {
            const Icon = priority.icon;
            return (
              <div
                key={priority.id}
                className={`bg-white border-l-4 ${priority.color} rounded-2xl p-4 shadow-sm active:scale-98 transition-all duration-200 animate-in slide-in-from-left-4`}
                style={{ animationDelay: `${350 + index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${priority.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm text-foreground mb-1">{priority.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{priority.subtitle}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${
                        priority.urgency === "high" ? "text-red-600 font-medium" : 
                        priority.urgency === "medium" ? "text-orange-600" : 
                        "text-muted-foreground"
                      }`}>
                        {priority.time}
                      </span>
                      {priority.urgency === "high" && (
                        <AlertCircle className="h-3 w-3 text-red-600 animate-pulse" />
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
