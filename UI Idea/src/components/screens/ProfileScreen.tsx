import { Settings, Bell, HelpCircle, FileText, LogOut, ChevronRight, Award, Calendar, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export function ProfileScreen() {
  const menuSections = [
    {
      title: 'Cont',
      items: [
        { icon: Settings, label: 'Setări cont', action: () => {} },
        { icon: Bell, label: 'Notificări', action: () => {} },
        { icon: Award, label: 'Badge-uri și realizări', action: () => {} },
      ],
    },
    {
      title: 'Informații',
      items: [
        { icon: Calendar, label: 'Licență și certificate', action: () => {} },
        { icon: Mail, label: 'Preferințe comunicare', action: () => {} },
        { icon: FileText, label: 'Documente și contracte', action: () => {} },
      ],
    },
    {
      title: 'Suport',
      items: [
        { icon: HelpCircle, label: 'Ajutor și FAQs', action: () => {} },
        { icon: LogOut, label: 'Deconectare', action: () => {}, destructive: true },
      ],
    },
  ];

  return (
    <div className="h-full overflow-y-auto pb-24 bg-[#F8FAFC]">
      <div className="px-5 pt-6 pb-6">
        <div className="bg-gradient-to-br from-[#1E293B] to-[#334155] rounded-[20px] p-6 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16 border-4 border-white/20 shadow-lg">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
              <AvatarFallback>AM</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-[20px] font-bold mb-1">Alex Munteanu</h1>
              <p className="text-[13px] text-white/80">Broker Associate</p>
              <p className="text-[12px] text-white/60 mt-1">ID: BR-2024-3847</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-[11px] text-white/70 mb-1">Tranzacții</p>
              <p className="text-[18px] font-bold">37</p>
            </div>
            <div>
              <p className="text-[11px] text-white/70 mb-1">Poziție</p>
              <p className="text-[18px] font-bold">#6</p>
            </div>
            <div>
              <p className="text-[11px] text-white/70 mb-1">Experiență</p>
              <p className="text-[18px] font-bold">7 luni</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h3 className="text-[13px] font-semibold text-[#64748B] mb-3 px-1">{section.title}</h3>
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] overflow-hidden shadow-sm">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIndex}
                    onClick={item.action}
                    className={`w-full flex items-center justify-between px-4 py-4 hover:bg-[#F8FAFC] transition-colors ${
                      itemIndex !== section.items.length - 1 ? 'border-b border-[#F1F5F9]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon 
                        size={20} 
                        className={item.destructive ? 'text-[#EF4444]' : 'text-[#64748B]'} 
                      />
                      <span className={`text-[14px] ${item.destructive ? 'text-[#EF4444] font-semibold' : 'text-[#0F172A]'}`}>
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight size={18} className="text-[#CBD5E1]" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pt-6 pb-4">
        <p className="text-[11px] text-[#94A3B8] text-center">
          CloudBroker v2.1.0 • © 2025
        </p>
      </div>
    </div>
  );
}
