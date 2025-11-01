import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const data = [
  { month: 'Ian', amount: 0 },
  { month: 'Feb', amount: 0 },
  { month: 'Mar', amount: 0 },
  { month: 'Apr', amount: 8200 },
  { month: 'Mai', amount: 9800 },
  { month: 'Iun', amount: 11500 },
  { month: 'Iul', amount: 10200 },
  { month: 'Aug', amount: 13400 },
  { month: 'Sep', amount: 11100 },
  { month: 'Oct', amount: 12480 },
];

export function CommissionChart() {
  return (
    <div className="mx-5 mb-4">
      <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-[#0F172A] mb-1">Evoluția comisionului tău</h3>
          <p className="text-[12px] text-[#64748B]">Din momentul intrării în agenție până azi</p>
        </div>

        <div className="h-[200px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis 
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0F172A',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#fff'
                }}
                formatter={(value: number) => [`€${value.toLocaleString('ro-RO')}`, 'Comision']}
              />
              <ReferenceLine 
                x="Apr" 
                stroke="#4F46E5" 
                strokeDasharray="3 3"
                label={{ 
                  value: 'Ai intrat în agenție', 
                  position: 'top',
                  fill: '#4F46E5',
                  fontSize: 10,
                  offset: 10
                }}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#4F46E5" 
                strokeWidth={3}
                dot={{ fill: '#4F46E5', r: 4 }}
                activeDot={{ r: 6, fill: '#4F46E5' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#F1F5F9]">
          <div className="w-3 h-3 rounded-full bg-[#4F46E5]" />
          <span className="text-[11px] text-[#64748B]">Comision lunar (€)</span>
        </div>
      </div>
    </div>
  );
}
