import { MapPin, Bed, Bath, Maximize, AlertCircle, Clock, Phone, Mail, MessageSquare } from "lucide-react";
import { useState } from "react";

interface Lead {
  id: string;
  propertyType: string;
  address: string;
  beds: number;
  baths: number;
  sqft: string;
  price: string;
  status: "hot" | "warm" | "cold";
  urgency?: "high" | "medium";
  urgencyReason?: string;
  image: string;
  daysListed?: number;
}

export function ActiveLeads() {
  const [hoveredUrgency, setHoveredUrgency] = useState<string | null>(null);

  const leads: Lead[] = [
    {
      id: "1",
      propertyType: "Modern Villa",
      address: "123 Sunset Boulevard, LA",
      beds: 4,
      baths: 3,
      sqft: "3,200",
      price: "$1.2M",
      status: "hot",
      urgency: "high",
      urgencyReason: "No response from lead in 72 hours",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
      daysListed: 2
    },
    {
      id: "2",
      propertyType: "Downtown Condo",
      address: "456 Park Avenue, NYC",
      beds: 2,
      baths: 2,
      sqft: "1,400",
      price: "$850K",
      status: "warm",
      urgency: "medium",
      urgencyReason: "Follow up scheduled for today",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
      daysListed: 5
    },
  ];

  const statusColors = {
    hot: "bg-red-500",
    warm: "bg-yellow-500",
    cold: "bg-blue-500"
  };

  const statusLabels = {
    hot: "Hot Lead",
    warm: "Warm",
    cold: "Cold"
  };

  const urgencyBadges = {
    high: { color: "bg-red-500", label: "Urgent Response", icon: AlertCircle },
    medium: { color: "bg-orange-500", label: "Follow Up Soon", icon: Clock }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/50">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-foreground">Active Leads</h3>
        <button className="text-sm text-primary hover:text-primary/80 transition-colors">
          View all
        </button>
      </div>
      
      <div className="space-y-4">
        {leads.map((lead) => {
          const UrgencyIcon = lead.urgency ? urgencyBadges[lead.urgency].icon : null;
          
          return (
            <div
              key={lead.id}
              className="rounded-2xl overflow-hidden border border-border/50 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={lead.image}
                  alt={lead.propertyType}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                  <span className={`px-3 py-1.5 ${statusColors[lead.status]} text-white text-xs rounded-full shadow-lg`}>
                    {statusLabels[lead.status]}
                  </span>
                  {lead.urgency && UrgencyIcon && (
                    <div 
                      className="relative"
                      onMouseEnter={() => setHoveredUrgency(lead.id)}
                      onMouseLeave={() => setHoveredUrgency(null)}
                    >
                      <span className={`px-3 py-1.5 ${urgencyBadges[lead.urgency].color} text-white text-xs rounded-full shadow-lg flex items-center gap-1.5 ${
                        lead.urgency === "high" ? "animate-pulse" : ""
                      }`}>
                        <UrgencyIcon className="h-3 w-3" />
                        {urgencyBadges[lead.urgency].label}
                      </span>
                      
                      {/* Quick Actions Tooltip */}
                      {hoveredUrgency === lead.id && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-border/50 p-3 z-10 animate-in fade-in slide-in-from-top-2 duration-150">
                          {lead.urgencyReason && (
                            <div className="pb-3 mb-3 border-b border-border/30">
                              <p className="text-xs text-muted-foreground mb-1">Why urgent?</p>
                              <p className="text-xs text-foreground">{lead.urgencyReason}</p>
                            </div>
                          )}
                          <div className="space-y-1.5">
                            <p className="text-xs text-muted-foreground mb-2">Quick Actions:</p>
                            <button className="w-full flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-xs hover:bg-primary/90 transition-colors">
                              <Phone className="h-3.5 w-3.5" />
                              Call Lead
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-lg text-xs hover:bg-secondary/80 transition-colors">
                              <Mail className="h-3.5 w-3.5" />
                              Send Email
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-lg text-xs hover:bg-secondary/80 transition-colors">
                              <MessageSquare className="h-3.5 w-3.5" />
                              Add Note
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {lead.daysListed !== undefined && (
                  <div className="absolute bottom-3 left-3">
                    <span className="px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full">
                      {lead.daysListed} days listed
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h4 className="text-foreground mb-1">{lead.propertyType}</h4>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{lead.address}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Bed className="h-4 w-4" />
                      <span>{lead.beds}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bath className="h-4 w-4" />
                      <span>{lead.baths}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Maximize className="h-4 w-4" />
                      <span>{lead.sqft} sqft</span>
                    </div>
                  </div>
                  <span className="text-primary">{lead.price}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}