import { Search, SlidersHorizontal, X, Bookmark, ChevronDown } from "lucide-react";
import { useState } from "react";

interface FilterPreset {
  id: string;
  name: string;
  filters: string[];
}

interface SearchBarProps {
  context?: "leads" | "properties" | "clients" | "all";
}

export function SearchBar({ context = "all" }: SearchBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showPresets, setShowPresets] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([
    { id: "1", name: "My Hot Leads", filters: ["leads", "urgent", "hot"] },
    { id: "2", name: "This Week's Visits", filters: ["properties", "pending", "active"] },
  ]);

  // Context-aware filter options
  const getContextualFilters = () => {
    const baseFilters = {
      leads: [
        { id: "no-response-48h", label: "No Response 48h", count: 5, color: "bg-red-100 text-red-700 border-red-200" },
        { id: "hot-lead", label: "Hot Lead", count: 8, color: "bg-orange-100 text-orange-700 border-orange-200" },
        { id: "first-contact", label: "First Contact", count: 12, color: "bg-blue-100 text-blue-700 border-blue-200" },
      ],
      properties: [
        { id: "price-reduced", label: "Price Reduced", count: 3, color: "bg-green-100 text-green-700 border-green-200" },
        { id: "new-listing", label: "New Listing", count: 7, color: "bg-blue-100 text-blue-700 border-blue-200" },
        { id: "high-demand", label: "High Demand", count: 4, color: "bg-purple-100 text-purple-700 border-purple-200" },
      ],
      clients: [
        { id: "active", label: "Active", count: 24, color: "bg-green-100 text-green-700 border-green-200" },
        { id: "pending", label: "Pending", count: 12, color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
        { id: "high-value", label: "High Value", count: 8, color: "bg-orange-100 text-orange-700 border-orange-200" },
      ],
      all: [
        { id: "urgent", label: "Urgent", count: 3, color: "bg-red-100 text-red-700 border-red-200" },
        { id: "today", label: "Today", count: 15, color: "bg-blue-100 text-blue-700 border-blue-200" },
        { id: "overdue", label: "Overdue", count: 5, color: "bg-orange-100 text-orange-700 border-orange-200" },
        { id: "high-value", label: "High Value", count: 8, color: "bg-purple-100 text-purple-700 border-purple-200" },
      ]
    };

    return baseFilters[context] || baseFilters.all;
  };

  const filterOptions = getContextualFilters();

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const clearFilters = () => {
    setActiveFilters([]);
  };

  const saveCurrentPreset = () => {
    if (activeFilters.length === 0) return;
    const name = prompt("Name your filter preset:");
    if (name) {
      setPresets([...presets, {
        id: Date.now().toString(),
        name,
        filters: activeFilters
      }]);
    }
  };

  const loadPreset = (preset: FilterPreset) => {
    setActiveFilters(preset.filters);
    setShowPresets(false);
  };

  const deletePreset = (presetId: string) => {
    setPresets(presets.filter(p => p.id !== presetId));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search properties, clients, leads..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-border/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
          />
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowPresets(!showPresets)}
            className="p-3.5 bg-white border border-border/50 rounded-2xl hover:bg-secondary/30 transition-colors relative"
            title="Saved Filters"
          >
            <Bookmark className="h-5 w-5" />
            {presets.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {presets.length}
              </span>
            )}
          </button>
          
          {/* Presets Dropdown */}
          {showPresets && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-border/50 p-3 z-10 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-foreground">Saved Filters</span>
                <button onClick={() => setShowPresets(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {presets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No saved filters yet</p>
              ) : (
                <div className="space-y-2">
                  {presets.map(preset => (
                    <div key={preset.id} className="flex items-center justify-between p-2 hover:bg-secondary/30 rounded-xl transition-colors group">
                      <button 
                        onClick={() => loadPreset(preset)}
                        className="flex-1 text-left text-sm text-foreground"
                      >
                        {preset.name}
                        <span className="text-xs text-muted-foreground ml-2">({preset.filters.length})</span>
                      </button>
                      <button
                        onClick={() => deletePreset(preset.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`p-3.5 bg-white border border-border/50 rounded-2xl transition-all ${
            isFilterOpen || activeFilters.length > 0
              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
              : "hover:bg-secondary/30"
          }`}
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Filter Pills */}
      {isFilterOpen && (
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-border/50 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm text-foreground">Quick Filters</span>
              <span className="text-xs text-muted-foreground ml-2">for {context === "all" ? "everything" : context}</span>
            </div>
            <div className="flex items-center gap-2">
              {activeFilters.length > 0 && (
                <button
                  onClick={saveCurrentPreset}
                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  <Bookmark className="h-3 w-3" />
                  Save
                </button>
              )}
              {activeFilters.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={`px-4 py-2 rounded-full text-xs transition-all border ${
                  activeFilters.includes(filter.id)
                    ? filter.color + " shadow-sm scale-105"
                    : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
                }`}
              >
                {filter.label} {filter.count > 0 && `(${filter.count})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilters.length > 0 && !isFilterOpen && (
        <div className="flex items-center gap-2 flex-wrap animate-in fade-in duration-200">
          <span className="text-xs text-muted-foreground">Filters:</span>
          {activeFilters.map((filterId) => {
            const filter = filterOptions.find(f => f.id === filterId);
            return filter ? (
              <span
                key={filterId}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${filter.color} animate-in slide-in-from-left-1 duration-150`}
              >
                {filter.label} ({filter.count})
                <button
                  onClick={() => toggleFilter(filterId)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}