import { Clock, AlertCircle, Phone, Mail, FileText, CheckCircle, DollarSign } from "lucide-react";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  type: "follow-up" | "contract" | "visit" | "payment";
  urgency: "overdue" | "today" | "upcoming";
  clientName: string;
  value?: string;
  dueTime: string;
  description: string;
  revenueImpact?: "high" | "medium" | "low";
}

export function PriorityInbox() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Follow up: Property viewing feedback",
      type: "follow-up",
      urgency: "overdue",
      clientName: "James Anderson",
      value: "$850K",
      dueTime: "2 hours ago",
      description: "Client viewed Modern Villa twice - high interest",
      revenueImpact: "high"
    },
    {
      id: "2",
      title: "Contract deadline approaching",
      type: "contract",
      urgency: "today",
      clientName: "Maria Garcia",
      value: "$1.2M",
      dueTime: "Today 3:00 PM",
      description: "Downtown Condo purchase agreement needs signature",
      revenueImpact: "high"
    },
    {
      id: "3",
      title: "Schedule property visit",
      type: "visit",
      urgency: "today",
      clientName: "Robert Chen",
      value: "$675K",
      dueTime: "Today 5:00 PM",
      description: "Requested visit to Suburban House",
      revenueImpact: "medium"
    },
    {
      id: "4",
      title: "Payment confirmation",
      type: "payment",
      urgency: "upcoming",
      clientName: "Sarah Miller",
      value: "$920K",
      dueTime: "Tomorrow",
      description: "Deposit payment for Luxury Apartment",
      revenueImpact: "high"
    }
  ]);

  const [filter, setFilter] = useState<"all" | "overdue" | "today" | "revenue">("all");

  const urgencyConfig = {
    overdue: {
      color: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      label: "Overdue",
      icon: AlertCircle
    },
    today: {
      color: "bg-orange-500",
      textColor: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      label: "Due Today",
      icon: Clock
    },
    upcoming: {
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      label: "Upcoming",
      icon: Clock
    }
  };

  const typeIcons = {
    "follow-up": Phone,
    "contract": FileText,
    "visit": Clock,
    "payment": DollarSign
  };

  const completeTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const filteredTasks = tasks
    .filter(task => {
      if (filter === "all") return true;
      if (filter === "revenue") return task.revenueImpact === "high";
      return task.urgency === filter;
    })
    .sort((a, b) => {
      const urgencyOrder = { overdue: 0, today: 1, upcoming: 2 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      // Within same urgency, sort by revenue impact
      const revenueOrder = { high: 0, medium: 1, low: 2 };
      return revenueOrder[a.revenueImpact || "low"] - revenueOrder[b.revenueImpact || "low"];
    });

  const taskCounts = {
    all: tasks.length,
    overdue: tasks.filter(t => t.urgency === "overdue").length,
    today: tasks.filter(t => t.urgency === "today").length,
    revenue: tasks.filter(t => t.revenueImpact === "high").length
  };

  const totalRevenue = tasks
    .filter(t => filter === "all" || (filter === "revenue" && t.revenueImpact === "high") || t.urgency === filter)
    .reduce((sum, task) => {
      const value = task.value?.replace(/[$,KM]/g, "") || "0";
      const multiplier = task.value?.includes("M") ? 1000 : 1;
      return sum + (parseFloat(value) * multiplier);
    }, 0);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl text-foreground mb-1">Today's Action Queue</h2>
          <p className="text-sm text-muted-foreground">What needs your attention right now</p>
          {totalRevenue > 0 && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>{totalRevenue >= 1000 ? `$${(totalRevenue/1000).toFixed(1)}M` : `$${totalRevenue}K`} revenue potential in view</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
              filter === "all"
                ? "bg-primary text-white shadow-sm"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            All ({taskCounts.all})
          </button>
          <button
            onClick={() => setFilter("overdue")}
            className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
              filter === "overdue"
                ? "bg-red-500 text-white shadow-sm"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            Overdue ({taskCounts.overdue})
          </button>
          <button
            onClick={() => setFilter("today")}
            className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
              filter === "today"
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            Today ({taskCounts.today})
          </button>
          <button
            onClick={() => setFilter("revenue")}
            className={`px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1 ${
              filter === "revenue"
                ? "bg-green-500 text-white shadow-sm"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            <DollarSign className="h-3 w-3" />
            High Value ({taskCounts.revenue})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-3" />
            <p className="text-foreground mb-1">All caught up!</p>
            <p className="text-sm text-muted-foreground">No {filter === "all" ? "" : filter} tasks at the moment</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const TypeIcon = typeIcons[task.type];
            const urgency = urgencyConfig[task.urgency];
            const UrgencyIcon = urgency.icon;

            return (
              <div
                key={task.id}
                className={`group rounded-2xl border-l-4 ${urgency.borderColor} bg-white hover:shadow-md transition-all duration-200 animate-in slide-in-from-left-2`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`${urgency.bgColor} ${urgency.textColor} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-sm text-foreground">{task.title}</h4>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${urgency.bgColor} ${urgency.textColor} ${
                            task.urgency === "overdue" ? "animate-pulse" : ""
                          }`}>
                            <UrgencyIcon className="h-3 w-3" />
                            {urgency.label}
                          </span>
                          {task.revenueImpact === "high" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                              <DollarSign className="h-3 w-3" />
                              High Revenue
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{task.description}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{task.clientName}</span>
                          {task.value && (
                            <>
                              <span className="text-muted-foreground/50">•</span>
                              <span className="text-primary font-medium">{task.value}</span>
                            </>
                          )}
                          <span className="text-muted-foreground/50">•</span>
                          <span className={task.urgency === "overdue" ? "text-red-600 font-medium" : ""}>
                            {task.dueTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="flex-1 px-3 py-2 bg-primary text-white rounded-xl text-xs hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      Call
                    </button>
                    <button className="flex-1 px-3 py-2 bg-secondary text-foreground rounded-xl text-xs hover:bg-secondary/80 transition-colors flex items-center justify-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </button>
                    <button
                      onClick={() => completeTask(task.id)}
                      className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-xl text-xs hover:bg-green-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Mark Done
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}