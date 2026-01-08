import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

export function LeadsChart() {
  const data = [
    { month: "Jan", leads: 12 },
    { month: "Feb", leads: 19 },
    { month: "Mar", leads: 15 },
    { month: "Apr", leads: 25 },
    { month: "May", leads: 22 },
    { month: "Jun", leads: 30 },
    { month: "Jul", leads: 28 },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-border/50">
          <p className="text-sm text-muted-foreground">{payload[0].payload.month}</p>
          <p className="text-foreground">{payload[0].value} leads</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/50">
      <div className="mb-6">
        <h3 className="text-foreground mb-1">Leads Growth</h3>
        <p className="text-sm text-muted-foreground">Monthly performance overview</p>
      </div>
      
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5B8DEF" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#5B8DEF" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Area 
            type="monotone" 
            dataKey="leads" 
            stroke="#5B8DEF" 
            strokeWidth={3}
            fill="url(#colorLeads)"
            dot={{ fill: '#5B8DEF', strokeWidth: 2, r: 4, stroke: '#fff' }}
            activeDot={{ r: 6, fill: '#5B8DEF', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
