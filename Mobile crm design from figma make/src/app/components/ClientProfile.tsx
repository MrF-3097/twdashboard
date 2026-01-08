import { 
  ArrowLeft, Phone, Mail, MessageSquare, Edit3, MapPin, DollarSign, 
  Home, User, Calendar, Clock, FileText, CheckCircle, AlertCircle,
  Filter, ChevronDown, Building2, Eye, Heart, Send, Plus, X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useState } from "react";

interface ClientProfileProps {
  clientId: string;
  onBack: () => void;
}

export function ClientProfile({ clientId, onBack }: ClientProfileProps) {
  const [timelineFilter, setTimelineFilter] = useState<"all" | "calls" | "emails" | "meetings" | "visits">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  // Mock client data - in production this would come from props or API
  const client = {
    id: clientId,
    name: "James Anderson",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    status: "active" as const,
    email: "james.anderson@email.com",
    phone: "+1 (555) 123-4567",
    budget: "$700K - $900K",
    preferredLocations: ["Downtown", "Midtown", "Suburban"],
    propertyType: "Single Family Home",
    assignedAgent: "John Doe",
    lastContact: "2 hours ago",
    clientSince: "Jan 15, 2024"
  };

  const statusConfig = {
    hot: { label: "Hot Lead", color: "bg-red-100 text-red-700 border-red-200" },
    active: { label: "Active Buyer", color: "bg-green-100 text-green-700 border-green-200" },
    seller: { label: "Seller", color: "bg-blue-100 text-blue-700 border-blue-200" },
    closed: { label: "Closed", color: "bg-gray-100 text-gray-700 border-gray-200" }
  };

  const timeline = [
    {
      id: "1",
      type: "call" as const,
      title: "Follow-up call about Modern Villa",
      description: "Discussed client's interest in the property. Very positive feedback on the location and layout. Wants to schedule a second viewing.",
      timestamp: "2 hours ago",
      date: "Dec 17, 2024 2:30 PM",
      duration: "15 min"
    },
    {
      id: "2",
      type: "visit" as const,
      title: "Property viewing: Modern Villa",
      description: "Client viewed the property with spouse. Showed strong interest in the master bedroom and backyard.",
      timestamp: "Yesterday",
      date: "Dec 16, 2024 3:00 PM",
      property: { name: "Modern Villa", address: "123 Oak Street" }
    },
    {
      id: "3",
      type: "email" as const,
      title: "Sent property listings",
      description: "Sent 5 curated property listings matching client preferences.",
      timestamp: "2 days ago",
      date: "Dec 15, 2024 10:15 AM"
    },
    {
      id: "4",
      type: "meeting" as const,
      title: "Initial consultation",
      description: "Discussed budget, timeline, and preferences. Client is looking for move-in ready homes in suburban areas.",
      timestamp: "1 week ago",
      date: "Dec 10, 2024 11:00 AM",
      duration: "45 min"
    }
  ];

  const properties = [
    {
      id: "1",
      name: "Modern Villa",
      address: "123 Oak Street",
      price: "$850K",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
      status: "visited" as const,
      visits: 2,
      lastVisit: "Yesterday"
    },
    {
      id: "2",
      name: "Downtown Condo",
      address: "456 Main Avenue",
      price: "$720K",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
      status: "interested" as const,
      savedDate: "3 days ago"
    },
    {
      id: "3",
      name: "Suburban House",
      address: "789 Maple Drive",
      price: "$680K",
      image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop",
      status: "requested" as const,
      requestedDate: "5 days ago"
    }
  ];

  const tasks = [
    {
      id: "1",
      title: "Schedule second viewing for Modern Villa",
      dueDate: "Today 5:00 PM",
      urgency: "high" as const,
      category: "upcoming" as const
    },
    {
      id: "2",
      title: "Send updated market analysis",
      dueDate: "Tomorrow 2:00 PM",
      urgency: "medium" as const,
      category: "upcoming" as const
    },
    {
      id: "3",
      title: "Follow up on financing pre-approval",
      dueDate: "2 hours ago",
      urgency: "high" as const,
      category: "overdue" as const
    }
  ];

  const notes = [
    {
      id: "1",
      author: "John Doe",
      content: "Client is very motivated. Spouse prefers modern designs. Budget is flexible if the right property comes along.",
      timestamp: "3 hours ago",
      date: "Dec 17, 2024 1:00 PM"
    },
    {
      id: "2",
      author: "John Doe",
      content: "Pre-approved for $900K mortgage. Looking to close within 60 days.",
      timestamp: "1 week ago",
      date: "Dec 10, 2024 11:45 AM"
    }
  ];

  const timelineIcons = {
    call: Phone,
    email: Mail,
    meeting: MessageSquare,
    visit: Building2
  };

  const propertyStatusConfig = {
    visited: { label: "Visited", color: "bg-blue-100 text-blue-700" },
    interested: { label: "Interested", color: "bg-green-100 text-green-700" },
    requested: { label: "Requested", color: "bg-purple-100 text-purple-700" }
  };

  const urgencyConfig = {
    high: { color: "text-red-600", bgColor: "bg-red-100", borderColor: "border-red-200" },
    medium: { color: "text-orange-600", bgColor: "bg-orange-100", borderColor: "border-orange-200" },
    low: { color: "text-blue-600", bgColor: "bg-blue-100", borderColor: "border-blue-200" }
  };

  const filteredTimeline = timeline.filter(event => {
    if (timelineFilter === "all") return true;
    if (timelineFilter === "calls") return event.type === "call";
    if (timelineFilter === "emails") return event.type === "email";
    if (timelineFilter === "meetings") return event.type === "meeting";
    if (timelineFilter === "visits") return event.type === "visit";
    return true;
  });

  const addNote = () => {
    if (noteText.trim()) {
      // In production, this would save to backend
      setNoteText("");
      setShowNoteEditor(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Client Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Back to Dashboard</span>
            </button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                <AvatarImage src={client.avatar} alt={client.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xl">
                  {client.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl text-foreground">{client.name}</h1>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${statusConfig[client.status].color}`}>
                    {statusConfig[client.status].label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Client since {client.clientSince}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
                <Phone className="h-4 w-4" />
                <span className="text-sm">Call</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors">
                <Mail className="h-4 w-4" />
                <span className="text-sm">Email</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">Message</span>
              </button>
              <button 
                onClick={() => setShowNoteEditor(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                <span className="text-sm">Add Note</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Key Client Information */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Budget</span>
            </div>
            <p className="text-foreground">{client.budget}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Locations</span>
            </div>
            <p className="text-sm text-foreground">{client.preferredLocations.join(", ")}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Home className="h-5 w-5 text-purple-600" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Property Type</span>
            </div>
            <p className="text-foreground">{client.propertyType}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-orange-600" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Agent</span>
            </div>
            <p className="text-foreground">{client.assignedAgent}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Last Contact</span>
            </div>
            <p className="text-foreground">{client.lastContact}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Timeline & Properties */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interaction Timeline */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl text-foreground mb-1">Interaction Timeline</h2>
                  <p className="text-sm text-muted-foreground">Complete history of client interactions</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-3 py-2 bg-secondary/50 text-foreground rounded-xl hover:bg-secondary transition-colors"
                  >
                    <Filter className="h-4 w-4" />
                    <span className="text-sm capitalize">{timelineFilter}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {showFilters && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-border/50 overflow-hidden z-10 animate-in slide-in-from-top-2 duration-200">
                      {["all", "calls", "emails", "meetings", "visits"].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => {
                            setTimelineFilter(filter as typeof timelineFilter);
                            setShowFilters(false);
                          }}
                          className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                            timelineFilter === filter
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-secondary/30"
                          }`}
                        >
                          <span className="capitalize">{filter}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {filteredTimeline.map((event, index) => {
                  const Icon = timelineIcons[event.type];
                  
                  return (
                    <div key={event.id} className="flex gap-4 relative group">
                      {index < filteredTimeline.length - 1 && (
                        <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border/50"></div>
                      )}
                      
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 border-2 border-white shadow-sm flex items-center justify-center relative z-10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="text-sm text-foreground">{event.title}</h4>
                          <span className="text-xs text-muted-foreground">{event.timestamp}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{event.date}</span>
                          {event.duration && (
                            <>
                              <span>•</span>
                              <span>{event.duration}</span>
                            </>
                          )}
                          {event.property && (
                            <>
                              <span>•</span>
                              <span className="text-primary">{event.property.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Properties & Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl text-foreground mb-1">Properties & Activity</h2>
                  <p className="text-sm text-muted-foreground">Tracked property interactions</p>
                </div>
                <button className="text-sm text-primary hover:text-primary/80 transition-colors">
                  View all
                </button>
              </div>

              <div className="space-y-3">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="group flex items-center gap-4 p-3 rounded-xl border border-border/30 hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <img
                      src={property.image}
                      alt={property.name}
                      className="w-24 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h4 className="text-sm text-foreground mb-0.5">{property.name}</h4>
                          <p className="text-xs text-muted-foreground">{property.address}</p>
                        </div>
                        <p className="text-sm text-primary">{property.price}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${propertyStatusConfig[property.status].color}`}>
                          {propertyStatusConfig[property.status].label}
                        </span>
                        {property.visits && (
                          <span className="text-xs text-muted-foreground">
                            {property.visits} visits • Last: {property.lastVisit}
                          </span>
                        )}
                        {property.savedDate && (
                          <span className="text-xs text-muted-foreground">
                            Saved {property.savedDate}
                          </span>
                        )}
                        {property.requestedDate && (
                          <span className="text-xs text-muted-foreground">
                            Requested {property.requestedDate}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Quick Actions on Hover */}
                    <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors" title="Schedule visit">
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button className="p-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors" title="Send listing">
                        <Send className="h-4 w-4" />
                      </button>
                      <button className="p-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors" title="Add note">
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Tasks & Notes */}
          <div className="space-y-6">
            {/* Tasks & Follow-Ups */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg text-foreground mb-1">Tasks & Follow-Ups</h2>
                  <p className="text-xs text-muted-foreground">Client-specific actions</p>
                </div>
                <button className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {tasks
                  .sort((a, b) => {
                    if (a.category === "overdue" && b.category !== "overdue") return -1;
                    if (a.category !== "overdue" && b.category === "overdue") return 1;
                    const urgencyOrder = { high: 0, medium: 1, low: 2 };
                    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
                  })
                  .map((task) => (
                    <div
                      key={task.id}
                      className={`group p-3 rounded-xl border-l-4 ${
                        task.category === "overdue" 
                          ? "border-red-500 bg-red-50/50" 
                          : urgencyConfig[task.urgency].borderColor + " bg-white"
                      } hover:shadow-md transition-all`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm text-foreground flex-1">{task.title}</h4>
                        {task.category === "overdue" && (
                          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className={`text-xs ${
                          task.category === "overdue" ? "text-red-600 font-medium" : "text-muted-foreground"
                        }`}>
                          {task.dueDate}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${urgencyConfig[task.urgency].bgColor} ${urgencyConfig[task.urgency].color}`}>
                          {task.urgency} priority
                        </span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="flex-1 px-2 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs hover:bg-green-100 transition-colors">
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          Complete
                        </button>
                        <button className="flex-1 px-2 py-1.5 bg-secondary text-foreground rounded-lg text-xs hover:bg-secondary/80 transition-colors">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Reschedule
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Notes & Internal Comments */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg text-foreground mb-1">Internal Notes</h2>
                  <p className="text-xs text-muted-foreground">Agent-only comments</p>
                </div>
                <button 
                  onClick={() => setShowNoteEditor(!showNoteEditor)}
                  className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  {showNoteEditor ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </button>
              </div>

              {/* Note Editor */}
              {showNoteEditor && (
                <div className="mb-4 p-3 bg-secondary/30 rounded-xl animate-in slide-in-from-top-2 duration-200">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add internal note..."
                    className="w-full min-h-[100px] px-3 py-2 bg-white border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={addNote}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs hover:bg-primary/90 transition-colors"
                    >
                      Save Note
                    </button>
                    <button
                      onClick={() => {
                        setNoteText("");
                        setShowNoteEditor(false);
                      }}
                      className="px-3 py-1.5 bg-secondary text-foreground rounded-lg text-xs hover:bg-secondary/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-foreground font-medium">{note.author}</span>
                      <span className="text-xs text-muted-foreground">{note.timestamp}</span>
                    </div>
                    <p className="text-sm text-foreground mb-1">{note.content}</p>
                    <p className="text-xs text-muted-foreground">{note.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
