import { Search, Calculator, MapPin, FileText, Mail, Phone, Calendar, Briefcase, TrendingUp, FileCheck } from 'lucide-react';

export function ToolsScreen() {
  const tools = [
    { icon: Calculator, name: 'Calculator ipotecă', description: 'Calculează ratele și eligibilitatea', color: 'from-[#4F46E5] to-[#6366F1]' },
    { icon: MapPin, name: 'Hartă proprietăți', description: 'Vezi toate listing-urile pe hartă', color: 'from-[#10B981] to-[#34D399]' },
    { icon: FileText, name: 'Generator contracte', description: 'Creează contracte personalizate', color: 'from-[#F59E0B] to-[#FBBF24]' },
    { icon: Mail, name: 'Template-uri email', description: 'Email-uri pre-scrise pentru clienți', color: 'from-[#06B6D4] to-[#22D3EE]' },
    { icon: Phone, name: 'Apeluri programate', description: 'Gestionează follow-up-urile', color: 'from-[#8B5CF6] to-[#A78BFA]' },
    { icon: Calendar, name: 'Calendar vizionări', description: 'Programează întâlniri cu clienți', color: 'from-[#EC4899] to-[#F472B6]' },
    { icon: Briefcase, name: 'CRM Clienți', description: 'Database-ul tău de clienți', color: 'from-[#14B8A6] to-[#2DD4BF]' },
    { icon: TrendingUp, name: 'Analiză piață', description: 'Rapoarte și tendințe locale', color: 'from-[#EF4444] to-[#F87171]' },
    { icon: FileCheck, name: 'Checklist tranzacții', description: 'Track progresul fiecărei vânzări', color: 'from-[#6366F1] to-[#818CF8]' },
  ];

  return (
    <div className="h-full overflow-y-auto pb-24 bg-[#F8FAFC]">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[24px] font-bold text-[#0F172A] mb-2">Instrumente</h1>
        <p className="text-[14px] text-[#64748B]">Toate tool-urile tale într-un singur loc</p>
      </div>

      <div className="px-5 mb-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
          <input
            type="text"
            placeholder="Caută instrumente..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-[12px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
          />
        </div>
      </div>

      <div className="px-5 space-y-3">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <button
              key={index}
              className="w-full bg-white rounded-[16px] border border-[#E2E8F0] p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
            >
              <div className={`w-12 h-12 rounded-[12px] bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-[14px] font-semibold text-[#0F172A] mb-0.5">{tool.name}</h3>
                <p className="text-[12px] text-[#64748B]">{tool.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
