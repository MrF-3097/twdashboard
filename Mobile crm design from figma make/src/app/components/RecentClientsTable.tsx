import { ChevronRight, Phone, Mail, Clock, MessageSquare, AlertCircle, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useState } from "react";

interface Client {
  id: string;
  name: string;
  status: "active" | "pending" | "negotiation";
  value: string;
  avatar?: string;
  lastContact: string;
  lastInteraction: string;
  urgency?: "high" | "medium";
  timeline?: Array<{
    type: "call" | "email" | "message" | "meeting";
    date: string;
    description: string;
  }>;
  predictedAction?: string;
}

interface RecentClientsTableProps {
  onClientClick?: (clientId: string) => void;
}

export function RecentClientsTable({ onClientClick }: RecentClientsTableProps) {
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const clients: Client[] = [
    {
      id: "1",
      name: "James Anderson",
      status: "active",
      value: "$850K",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      lastContact: "2 hours ago",
      lastInteraction: "Discussed property tour details",
      urgency: "high",
      predictedAction: "Schedule follow-up call - viewed property twice",
      timeline: [
        { type: "call", date: "2 hours ago", description: "Discussed property tour" },
        { type: "email", date: "Yesterday", description: "Sent property listings" },
        { type: "meeting", date: "3 days ago", description: "Initial consultation" },
      ]
    },
    {
      id: "2",
      name: "Maria Garcia",
      status: "negotiation",
      value: "$1.2M",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
      lastContact: "1 day ago",
      lastInteraction: "Follow-up on purchase offer",
      urgency: "medium",
      predictedAction: "Send contract reminder - offer accepted 3 days ago",
      timeline: [
        { type: "email", date: "1 day ago", description: "Follow-up on offer" },
        { type: "call", date: "4 days ago", description: "Price negotiation" },
      ]
    },
    {
      id: "3",
      name: "Robert Chen",
      status: "active",
      value: "$675K",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      lastContact: "3 hours ago",
      lastInteraction: "Quick status update via message",
      timeline: [
        { type: "message", date: "3 hours ago", description: "Quick update" },
        { type: "meeting", date: "1 week ago", description: "Property viewing" },
      ]
    },
    {
      id: "4",
      name: "Sarah Miller",
      status: "pending",
      value: "$920K",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop",
      lastContact: "5 hours ago",
      lastInteraction: "Sent property brochure",
      timeline: [
        { type: "email", date: "5 hours ago", description: "Sent property brochure" },
      ]
    },
  ];

  const statusConfig = {
    active: { label: "Active", color: "bg-green-100 text-green-700 border-green-200" },
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    negotiation: { label: "Negotiation", color: "bg-blue-100 text-blue-700 border-blue-200" }
  };

  const urgencyConfig = {
    high: { color: "bg-red-500", icon: AlertCircle },
    medium: { color: "bg-orange-500", icon: Clock }
  };

  const timelineIcons = {
    call: Phone,
    email: Mail,
    message: MessageSquare,
    meeting: Clock
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
        <div>
          <h3 className="text-foreground">Recent Clients</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Active client interactions</p>
        </div>
        <button className="text-sm text-primary hover:text-primary/80 transition-colors">
          View all clients
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">Last Contact</th>
              <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">Last Interaction</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {clients.map((client) => {
              const isExpanded = expandedClient === client.id;
              const UrgencyIcon = client.urgency ? urgencyConfig[client.urgency].icon : null;

              const mainRow = (
                <tr 
                  key={`${client.id}-main`}
                  className="hover:bg-secondary/20 transition-colors cursor-pointer"
                  onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                          <AvatarImage src={client.avatar} alt={client.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm">
                            {client.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {client.urgency && UrgencyIcon && (
                          <span className={`absolute -top-1 -right-1 h-4 w-4 ${urgencyConfig[client.urgency].color} rounded-full border-2 border-white flex items-center justify-center ${
                            client.urgency === "high" ? "animate-pulse" : ""
                          }`}>
                            <UrgencyIcon className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-foreground">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${statusConfig[client.status].color}`}>
                      {statusConfig[client.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-primary">{client.value}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{client.lastContact}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{client.lastInteraction}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className={`h-5 w-5 text-muted-foreground inline-block transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`} />
                  </td>
                </tr>
              );

              const expandedRow = isExpanded ? (
                <tr key={`${client.id}-expanded`}>
                  <td colSpan={6} className="px-6 py-4 bg-secondary/10">
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                      {/* Predictive Action */}
                      {client.predictedAction && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 border border-blue-200/50">
                          <div className="flex items-start gap-2">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg p-1.5 flex-shrink-0">
                              <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground">
                                <span className="font-medium">Suggested:</span> {client.predictedAction}
                              </p>
                            </div>
                            <button className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-lg hover:shadow-md transition-all">
                              Take Action
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Timeline */}
                      {client.timeline && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Recent Activity</p>
                          <div className="space-y-3 ml-4">
                            {client.timeline.map((activity, index) => {
                              const Icon = timelineIcons[activity.type];
                              return (
                                <div key={index} className="flex items-start gap-3 relative">
                                  {index < client.timeline!.length - 1 && (
                                    <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border/50"></div>
                                  )}
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center relative z-10">
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
                        </div>
                      )}

                      {/* View Full Profile Button */}
                      {onClientClick && (
                        <div className="pt-2 border-t border-border/30">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClientClick(client.id);
                            }}
                            className="w-full px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors text-sm"
                          >
                            View Full Profile
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : null;

              return [mainRow, expandedRow];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}