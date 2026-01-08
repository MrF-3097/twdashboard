import { ChevronRight, Clock, Phone, Mail, MessageSquare, AlertCircle, Lightbulb, Filter, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useState } from "react";

interface Client {
  id: string;
  name: string;
  status: "active" | "pending" | "lost";
  value: string;
  avatar?: string;
  lastContact: string;
  urgency?: "high" | "medium";
  timeline?: Array<{
    type: "call" | "email" | "message" | "meeting";
    date: string;
    description: string;
  }>;
  predictedAction?: {
    suggestion: string;
    reason: string;
  };
}

export function ClientsList() {
  const [timelineFilter, setTimelineFilter] = useState<"all" | "calls" | "emails" | "meetings">("all");
  const [showImportantOnly, setShowImportantOnly] = useState(false);

  const clients: Client[] = [
    {
      id: "1",
      name: "James Anderson",
      status: "active",
      value: "$850K",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      lastContact: "2 hours ago",
      urgency: "high",
      predictedAction: {
        suggestion: "Schedule follow-up call",
        reason: "Client viewed property twice in 48h"
      },
      timeline: [
        { type: "call", date: "2 hours ago", description: "Discussed property tour" },
        { type: "email", date: "Yesterday", description: "Sent property listings" },
        { type: "email", date: "Yesterday", description: "Follow-up email sent" },
        { type: "email", date: "2 days ago", description: "Thank you note" },
        { type: "meeting", date: "3 days ago", description: "Initial consultation" },
      ]
    },
    {
      id: "2",
      name: "Maria Garcia",
      status: "pending",
      value: "$1.2M",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
      lastContact: "1 day ago",
      urgency: "medium",
      predictedAction: {
        suggestion: "Send contract reminder",
        reason: "Offer accepted 3 days ago"
      },
      timeline: [
        { type: "email", date: "1 day ago", description: "Follow-up on offer" },
        { type: "call", date: "4 days ago", description: "Price negotiation" },
        { type: "meeting", date: "1 week ago", description: "Property showing" },
      ]
    },
    {
      id: "3",
      name: "Robert Chen",
      status: "active",
      value: "$675K",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      lastContact: "3 hours ago",
      timeline: [
        { type: "message", date: "3 hours ago", description: "Quick update" },
        { type: "call", date: "5 hours ago", description: "Phone consultation" },
        { type: "meeting", date: "1 week ago", description: "Property viewing" },
      ]
    },
    {
      id: "4",
      name: "Sarah Miller",
      status: "lost",
      value: "$920K",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop",
      lastContact: "1 week ago",
      timeline: [
        { type: "email", date: "1 week ago", description: "Final follow-up" },
        { type: "call", date: "2 weeks ago", description: "Last contact attempt" },
      ]
    },
  ];

  const statusColors = {
    active: "bg-green-500",
    pending: "bg-yellow-500",
    lost: "bg-red-500"
  };

  const statusLabels = {
    active: "Interested",
    pending: "Pending",
    lost: "Lost"
  };

  const urgencyBadges = {
    high: { color: "bg-red-500", label: "Urgent", icon: AlertCircle },
    medium: { color: "bg-yellow-500", label: "Follow Up", icon: Clock }
  };

  const timelineIcons = {
    call: Phone,
    email: Mail,
    message: MessageSquare,
    meeting: Clock
  };

  const filterTimeline = (timeline: Client["timeline"]) => {
    if (!timeline) return [];
    
    let filtered = timeline;
    
    if (timelineFilter !== "all") {
      filtered = filtered.filter(item => {
        if (timelineFilter === "calls") return item.type === "call";
        if (timelineFilter === "emails") return item.type === "email";
        if (timelineFilter === "meetings") return item.type === "meeting";
        return true;
      });
    }
    
    return filtered;
  };

  const groupConsecutiveEmails = (timeline: Client["timeline"]) => {
    if (!timeline) return [];
    
    const grouped: Array<any> = [];
    let emailGroup: any[] = [];
    
    timeline.forEach((item, index) => {
      if (item.type === "email") {
        emailGroup.push(item);
        if (index === timeline.length - 1 || timeline[index + 1].type !== "email") {
          if (emailGroup.length > 2) {
            grouped.push({
              type: "email-group",
              count: emailGroup.length,
              dateRange: `${emailGroup[emailGroup.length - 1].date} - ${emailGroup[0].date}`,
              items: emailGroup
            });
          } else {
            grouped.push(...emailGroup);
          }
          emailGroup = [];
        }
      } else {
        grouped.push(item);
      }
    });
    
    return grouped;
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/50">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-foreground">Recent Clients</h3>
        <button className="text-sm text-primary hover:text-primary/80 transition-colors">
          View all
        </button>
      </div>
      
      <div className="space-y-4">
        {clients.map((client) => {
          const filteredTimeline = filterTimeline(client.timeline);
          const groupedTimeline = groupConsecutiveEmails(filteredTimeline);
          
          return (
            <details key={client.id} className="group/details">
              <summary className="flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/30 transition-all duration-200 cursor-pointer list-none group-open/details:bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm">
                      <AvatarImage src={client.avatar} alt={client.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {client.urgency && (() => {
                      const UrgencyIcon = urgencyBadges[client.urgency].icon;
                      return (
                        <span className={`absolute -top-1 -right-1 h-4 w-4 ${urgencyBadges[client.urgency].color} rounded-full border-2 border-white flex items-center justify-center ${
                          client.urgency === "high" ? "animate-pulse" : ""
                        }`}>
                          <UrgencyIcon className="h-2.5 w-2.5 text-white" />
                        </span>
                      );
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-foreground">{client.name}</p>
                      {client.urgency && (() => {
                        const UrgencyIcon = urgencyBadges[client.urgency].icon;
                        return (
                          <span className={`px-2 py-0.5 ${urgencyBadges[client.urgency].color} text-white text-xs rounded-full flex items-center gap-1`}>
                            <UrgencyIcon className="h-3 w-3" />
                            {urgencyBadges[client.urgency].label}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${statusColors[client.status]}`}></span>
                      <span className="text-xs text-muted-foreground">{statusLabels[client.status]}</span>
                      <span className="text-xs text-muted-foreground/60">• {client.lastContact}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">{client.value}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/details:text-primary transition-all group-open/details:rotate-90 duration-200" />
                </div>
              </summary>

              {/* Expanded Content */}
              <div className="ml-16 mt-3 mb-2 space-y-4 animate-in slide-in-from-top-2 duration-200">
                {/* Predictive Action */}
                {client.predictedAction && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 border border-blue-200/50 animate-in fade-in duration-300">
                    <div className="flex items-start gap-2">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg p-1.5 flex-shrink-0">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-foreground mb-0.5">
                          <span className="font-medium">Suggested:</span> {client.predictedAction.suggestion}
                        </p>
                        <p className="text-xs text-muted-foreground">{client.predictedAction.reason}</p>
                      </div>
                      <button className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-lg hover:shadow-md transition-all">
                        Act
                      </button>
                    </div>
                  </div>
                )}

                {/* Timeline Filters */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Activity</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.preventDefault(); setTimelineFilter("all"); }}
                      className={`px-2 py-1 text-xs rounded-lg transition-all ${
                        timelineFilter === "all" ? "bg-primary text-white" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); setTimelineFilter("calls"); }}
                      className={`px-2 py-1 text-xs rounded-lg transition-all ${
                        timelineFilter === "calls" ? "bg-primary text-white" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      Calls
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); setTimelineFilter("emails"); }}
                      className={`px-2 py-1 text-xs rounded-lg transition-all ${
                        timelineFilter === "emails" ? "bg-primary text-white" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      Emails
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); setTimelineFilter("meetings"); }}
                      className={`px-2 py-1 text-xs rounded-lg transition-all ${
                        timelineFilter === "meetings" ? "bg-primary text-white" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      Meetings
                    </button>
                  </div>
                </div>

                {/* Timeline */}
                {groupedTimeline.map((activity, index) => {
                  if (activity.type === "email-group") {
                    return (
                      <details key={index} className="group/group">
                        <summary className="flex items-start gap-3 relative cursor-pointer list-none hover:bg-secondary/30 rounded-lg p-2 -m-2 transition-colors">
                          {index < groupedTimeline.length - 1 && (
                            <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border/50"></div>
                          )}
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center relative z-10">
                            <Mail className="h-3 w-3 text-blue-600" />
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className="text-sm text-foreground">{activity.count} emails exchanged</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{activity.dateRange}</p>
                          </div>
                        </summary>
                        <div className="ml-9 mt-2 space-y-2 animate-in slide-in-from-top-1 duration-150">
                          {activity.items.map((email: any, emailIndex: number) => (
                            <div key={emailIndex} className="text-xs text-muted-foreground pl-3 border-l-2 border-blue-200">
                              <p className="text-foreground">{email.description}</p>
                              <p className="text-xs mt-0.5">{email.date}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    );
                  }

                  const Icon = timelineIcons[activity.type as keyof typeof timelineIcons];
                  return (
                    <div key={index} className="flex items-start gap-3 relative group/item">
                      {index < groupedTimeline.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border/50"></div>
                      )}
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center relative z-10 group-hover/item:scale-110 transition-transform">
                        <Icon className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm text-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{activity.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}