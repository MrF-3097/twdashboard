import { AlertCircle, Flame, FileCheck, Calendar, TrendingUp, TrendingDown } from "lucide-react";

export function PriorityOverview() {
  const cards = [
    {
      id: "urgent",
      title: "Urgent Tasks",
      value: "5",
      subtitle: "Require immediate attention",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      trend: { value: "+2", direction: "up" as const, label: "from yesterday" }
    },
    {
      id: "hot-leads",
      title: "Hot Leads",
      value: "8",
      subtitle: "High conversion potential",
      icon: Flame,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      trend: { value: "+3", direction: "up" as const, label: "this week" }
    },
    {
      id: "pending-deals",
      title: "Pending Deals",
      value: "$2.4M",
      subtitle: "Awaiting signatures",
      icon: FileCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      trend: { value: "85%", direction: "neutral" as const, label: "close probability" }
    },
    {
      id: "today-meetings",
      title: "Today's Meetings",
      value: "4",
      subtitle: "Scheduled for today",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      trend: { value: "2", direction: "neutral" as const, label: "confirmed" }
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const TrendIcon = card.trend.direction === "up" ? TrendingUp : TrendingDown;
        
        return (
          <div
            key={card.id}
            className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${card.borderColor} hover:shadow-md transition-all cursor-pointer group`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`${card.bgColor} ${card.color} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className="h-6 w-6" />
              </div>
              {card.trend.direction !== "neutral" && (
                <div className={`flex items-center gap-1 ${
                  card.trend.direction === "up" ? "text-green-600" : "text-red-600"
                }`}>
                  <TrendIcon className="h-4 w-4" />
                  <span className="text-xs">{card.trend.value}</span>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-3xl text-foreground mb-1">{card.value}</h3>
              <p className="text-sm text-foreground mb-1">{card.title}</p>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </div>

            <div className="mt-3 pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground">{card.trend.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
