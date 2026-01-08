import { Calendar, FileCheck, DollarSign, Mail, AlertCircle, Clock } from "lucide-react";

export function SecondaryCards() {
  const cards = [
    {
      icon: Calendar,
      title: "Pending Visits",
      value: "12",
      subtitle: "This week",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      urgency: "medium" as const
    },
    {
      icon: FileCheck,
      title: "Contracts to Sign",
      value: "5",
      subtitle: "Awaiting signature",
      color: "text-green-600",
      bgColor: "bg-green-50",
      urgency: "high" as const
    },
    {
      icon: DollarSign,
      title: "Payments Due",
      value: "$45K",
      subtitle: "Next 7 days",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      urgency: "high" as const
    },
    {
      icon: Mail,
      title: "New Requests",
      value: "18",
      subtitle: "Unread",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
  ];

  const urgencyBadges = {
    high: { color: "bg-red-500", icon: AlertCircle },
    medium: { color: "bg-yellow-500", icon: Clock }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((card, index) => {
        const UrgencyIcon = card.urgency ? urgencyBadges[card.urgency].icon : null;
        return (
          <div
            key={index}
            className="bg-white rounded-3xl p-5 shadow-sm border border-border/50 hover:shadow-md transition-shadow cursor-pointer group relative"
          >
            {card.urgency && (
              <div className="absolute top-3 right-3">
                <span className={`${urgencyBadges[card.urgency].color} h-2 w-2 rounded-full animate-pulse inline-block`}></span>
              </div>
            )}
            <div className={`${card.bgColor} ${card.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <card.icon className="h-6 w-6" />
            </div>
            <h4 className="text-foreground mb-1 flex items-center gap-2">
              {card.title}
              {card.urgency && UrgencyIcon && (
                <span className={`inline-flex items-center justify-center h-5 w-5 ${urgencyBadges[card.urgency].color} rounded-full`}>
                  <UrgencyIcon className="h-3 w-3 text-white" />
                </span>
              )}
            </h4>
            <p className="text-3xl text-foreground mb-1">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}