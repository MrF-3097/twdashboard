import { AlertCircle, Clock, Phone, Mail, StickyNote } from "lucide-react";
import { useState } from "react";

interface UrgencyBadgeProps {
  level: "high" | "medium" | "low";
  reason?: string;
  clientName?: string;
  onAction?: (action: "call" | "email" | "note") => void;
  showQuickActions?: boolean;
}

export function UrgencyBadge({ 
  level, 
  reason, 
  clientName, 
  onAction,
  showQuickActions = true 
}: UrgencyBadgeProps) {
  const [showActions, setShowActions] = useState(false);

  const urgencyConfig = {
    high: {
      color: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      label: "Urgent",
      icon: AlertCircle,
      pulse: true
    },
    medium: {
      color: "bg-orange-500",
      textColor: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      label: "Follow Up",
      icon: Clock,
      pulse: false
    },
    low: {
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      label: "Monitor",
      icon: Clock,
      pulse: false
    }
  };

  const config = urgencyConfig[level];
  const Icon = config.icon;

  const handleAction = (action: "call" | "email" | "note") => {
    if (onAction) {
      onAction(action);
    }
    setShowActions(false);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => showQuickActions && setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Badge */}
      <span 
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${config.color} text-white text-xs rounded-full cursor-pointer ${
          config.pulse ? "animate-pulse" : ""
        }`}
        role="status"
        aria-label={`${config.label} priority${reason ? `: ${reason}` : ""}`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>

      {/* Tooltip & Quick Actions */}
      {showActions && showQuickActions && (
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 animate-in fade-in slide-in-from-top-1 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-xl shadow-xl border border-border/50 p-3 min-w-[220px]">
            {/* Reason */}
            {reason && (
              <div className="pb-3 mb-3 border-b border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Why urgent?</p>
                <p className="text-xs text-foreground">{reason}</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground mb-2">Quick Actions:</p>
              <button
                onClick={() => handleAction("call")}
                className="w-full flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-xs hover:bg-primary/90 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                Call {clientName || "client"}
              </button>
              <button
                onClick={() => handleAction("email")}
                className="w-full flex items-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-lg text-xs hover:bg-secondary/80 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                Send Email
              </button>
              <button
                onClick={() => handleAction("note")}
                className="w-full flex items-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-lg text-xs hover:bg-secondary/80 transition-colors"
              >
                <StickyNote className="h-3.5 w-3.5" />
                Add Note
              </button>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-white"></div>
        </div>
      )}
    </div>
  );
}
