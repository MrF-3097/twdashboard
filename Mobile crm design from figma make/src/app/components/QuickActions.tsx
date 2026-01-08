import { Plus, UserPlus, Calendar, FileText } from "lucide-react";

export function QuickActions() {
  const actions = [
    { icon: Plus, label: "Add Property", color: "text-blue-600" },
    { icon: UserPlus, label: "Add Client", color: "text-purple-600" },
    { icon: Calendar, label: "Schedule Visit", color: "text-green-600" },
    { icon: FileText, label: "Create Lead", color: "text-orange-600" },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {actions.map((action, index) => (
        <button
          key={index}
          className="flex items-center gap-3 px-5 py-3.5 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200 border border-border/50 hover:border-primary/30 whitespace-nowrap group"
        >
          <div className={`${action.color} group-hover:scale-110 transition-transform`}>
            <action.icon className="h-5 w-5" />
          </div>
          <span className="text-sm text-foreground">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
