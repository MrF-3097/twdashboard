import { Phone, Mail, MessageSquare, ChevronRight, Search, Filter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useState, useEffect } from "react";

export function ClientsScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const clients = [
    {
      id: "1",
      name: "James Anderson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      status: "Hot Lead",
      statusColor: "bg-red-100 text-red-700 border-red-200",
      lastInteraction: "2 hours ago",
      type: "Buyer",
      budget: "$700K - $900K",
      propertyType: "House"
    },
    {
      id: "2",
      name: "Maria Garcia",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
      status: "Active",
      statusColor: "bg-green-100 text-green-700 border-green-200",
      lastInteraction: "1 day ago",
      type: "Buyer",
      budget: "$1M - $1.5M",
      propertyType: "Apartment"
    },
    {
      id: "3",
      name: "Robert Chen",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      status: "Active",
      statusColor: "bg-green-100 text-green-700 border-green-200",
      lastInteraction: "3 hours ago",
      type: "Renter",
      budget: "$2K - $3K/mo",
      propertyType: "Apartment"
    },
    {
      id: "4",
      name: "Sarah Miller",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop",
      status: "Pending",
      statusColor: "bg-yellow-100 text-yellow-700 border-yellow-200",
      lastInteraction: "5 hours ago",
      type: "Buyer",
      budget: "$800K - $950K",
      propertyType: "House"
    }
  ];

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-24 pt-4 px-4">
      {/* Header */}
      <div className={`mb-6 animate-in slide-in-from-top-4 duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className="text-2xl text-foreground mb-1">Clients</h1>
        <p className="text-sm text-muted-foreground">{clients.length} total clients</p>
      </div>

      {/* Search Bar */}
      <div className={`mb-4 animate-in slide-in-from-top-5 duration-500 delay-100 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-11 pr-12 py-3 bg-white border border-border/50 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <Filter className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Client Cards */}
      <div className="space-y-3">
        {filteredClients.map((client, index) => {
          const isExpanded = expandedClient === client.id;
          
          return (
            <div
              key={client.id}
              className={`bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden transition-all duration-300 animate-in slide-in-from-left-4 ${
                isExpanded ? "shadow-md" : ""
              }`}
              style={{ animationDelay: `${200 + index * 50}ms` }}
            >
              <div
                onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                className="p-4 active:bg-secondary/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm flex-shrink-0">
                    <AvatarImage src={client.avatar} alt={client.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-foreground mb-1">{client.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${client.statusColor}`}>
                        {client.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {client.lastInteraction}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                    isExpanded ? "rotate-90" : ""
                  }`} />
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-border/30 bg-secondary/10 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Type</p>
                      <p className="text-sm text-foreground">{client.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Budget</p>
                      <p className="text-sm text-foreground">{client.budget}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Looking for</p>
                      <p className="text-sm text-foreground">{client.propertyType}</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button className="flex flex-col items-center gap-1.5 py-3 bg-primary/10 text-primary rounded-xl active:scale-95 transition-all">
                      <Phone className="h-5 w-5" />
                      <span className="text-xs">Call</span>
                    </button>
                    <button className="flex flex-col items-center gap-1.5 py-3 bg-secondary text-foreground rounded-xl active:scale-95 transition-all">
                      <Mail className="h-5 w-5" />
                      <span className="text-xs">Email</span>
                    </button>
                    <button className="flex flex-col items-center gap-1.5 py-3 bg-secondary text-foreground rounded-xl active:scale-95 transition-all">
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-xs">Message</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No clients found</p>
        </div>
      )}
    </div>
  );
}
