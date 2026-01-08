import { Plus } from "lucide-react";

export function PrimaryCTA() {
  return (
    <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl px-6 py-4 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-3 group">
      <div className="p-1 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
        <Plus className="h-5 w-5" />
      </div>
      <span>Create New Listing</span>
    </button>
  );
}
