export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/50 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-secondary/50 rounded-xl"></div>
        <div className="w-12 h-4 bg-secondary/50 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="w-16 h-8 bg-secondary/50 rounded"></div>
        <div className="w-24 h-4 bg-secondary/50 rounded"></div>
        <div className="w-32 h-3 bg-secondary/30 rounded"></div>
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-border/30">
        <div className="w-32 h-5 bg-secondary/50 rounded"></div>
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-10 h-10 bg-secondary/50 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="w-32 h-4 bg-secondary/50 rounded"></div>
              <div className="w-48 h-3 bg-secondary/30 rounded"></div>
            </div>
            <div className="w-20 h-4 bg-secondary/50 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonInboxItem() {
  return (
    <div className="rounded-2xl border-l-4 border-secondary/50 bg-white p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-secondary/50 rounded-xl"></div>
        <div className="flex-1 space-y-2">
          <div className="w-48 h-4 bg-secondary/50 rounded"></div>
          <div className="w-full h-3 bg-secondary/30 rounded"></div>
          <div className="w-32 h-3 bg-secondary/30 rounded"></div>
        </div>
      </div>
    </div>
  );
}
