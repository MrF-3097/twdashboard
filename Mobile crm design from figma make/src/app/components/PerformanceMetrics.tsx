import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

export function PerformanceMetrics() {
  const funnelStages = [
    { stage: "Leads", count: 145, color: "bg-blue-500", percentage: 100 },
    { stage: "Visits", count: 68, color: "bg-purple-500", percentage: 47 },
    { stage: "Offers", count: 24, color: "bg-orange-500", percentage: 17 },
    { stage: "Deals", count: 12, color: "bg-green-500", percentage: 8 }
  ];

  const weeklyMetrics = [
    {
      title: "Conversion Rate",
      current: "8.3%",
      previous: "7.1%",
      trend: "up",
      sparkline: [45, 52, 48, 61, 55, 68, 71]
    },
    {
      title: "Avg Deal Value",
      current: "$890K",
      previous: "$845K",
      trend: "up",
      sparkline: [820, 850, 835, 870, 865, 890, 895]
    },
    {
      title: "Response Time",
      current: "2.4h",
      previous: "3.1h",
      trend: "down",
      sparkline: [3.5, 3.2, 2.9, 2.8, 2.6, 2.5, 2.4]
    }
  ];

  const Sparkline = ({ data, trend }: { data: number[], trend: "up" | "down" }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-full h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={trend === "up" ? "#10b981" : "#3b82f6"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-80"
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Conversion Funnel */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/50">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-foreground">Sales Funnel</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Current month performance</p>
          </div>
          <span className="text-xs text-muted-foreground">8.3% conversion</span>
        </div>

        <div className="space-y-3">
          {funnelStages.map((stage, index) => (
            <div key={stage.stage}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">{stage.stage}</span>
                  <span className="text-xs text-muted-foreground">({stage.percentage}%)</span>
                </div>
                <span className="text-sm text-foreground">{stage.count}</span>
              </div>
              <div className="relative h-12 rounded-2xl bg-secondary/30 overflow-hidden">
                <div 
                  className={`h-full ${stage.color} transition-all duration-700 ease-out flex items-center justify-between px-4`}
                  style={{ width: `${stage.percentage}%` }}
                >
                  <span className="text-white text-xs opacity-90">{stage.count} {stage.stage.toLowerCase()}</span>
                </div>
              </div>
              {index < funnelStages.length - 1 && (
                <div className="flex items-center justify-center my-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Comparison Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {weeklyMetrics.map((metric) => (
          <div 
            key={metric.title}
            className="bg-white rounded-3xl p-5 shadow-sm border border-border/50 hover:shadow-md transition-shadow"
          >
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">{metric.title}</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl text-foreground">{metric.current}</span>
                <div className={`flex items-center gap-1 text-xs ${
                  (metric.trend === "up" && !metric.title.includes("Time")) || 
                  (metric.trend === "down" && metric.title.includes("Time"))
                    ? "text-green-600"
                    : "text-blue-600"
                }`}>
                  {((metric.trend === "up" && !metric.title.includes("Time")) || 
                    (metric.trend === "down" && metric.title.includes("Time"))) ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>vs {metric.previous}</span>
                </div>
              </div>
            </div>
            <Sparkline data={metric.sparkline} trend={metric.trend} />
            <p className="text-xs text-muted-foreground mt-2">Last 7 days</p>
          </div>
        ))}
      </div>
    </div>
  );
}
