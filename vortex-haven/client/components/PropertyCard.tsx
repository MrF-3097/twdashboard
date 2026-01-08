import { MessageSquare, User } from "lucide-react";

interface PropertyCardProps {
  budget: string;
  budgetExtra?: string;
  type: string;
  specifications: string;
  area: string;
  zone: string;
  contactName: string;
}

export default function PropertyCard({
  budget,
  budgetExtra,
  type,
  specifications,
  area,
  zone,
  contactName,
}: PropertyCardProps) {
  return (
    <div className="w-full max-w-[250px] h-[148px] flex flex-col justify-between rounded-[20px] border border-gray-light bg-white p-0 relative">
      <div className="flex flex-col gap-0">
        <div className="relative h-5 flex items-center">
          <div className="bg-primary-blue rounded-tl-[20px] rounded-br-[20px] h-5 flex items-center px-4 flex-1 relative">
            <span className="text-white text-xs font-normal leading-none">
              {budget}
            </span>
            {budgetExtra && (
              <span className="text-[#F5F7FA] text-[8px] font-normal leading-none ml-2">
                {budgetExtra}
              </span>
            )}
          </div>
          <div className="h-5 border border-primary-blue rounded-tr-[20px] rounded-bl-[20px] flex items-center justify-center px-3 min-w-[65px] bg-white">
            <span className="text-gray-dark text-[8px] font-normal leading-none">
              Budget
            </span>
          </div>
        </div>

        <div className="px-4 pt-[9px] grid grid-cols-2 gap-x-4">
          <div className="flex flex-col gap-0">
            <span className="text-gray-medium text-[8px] font-normal leading-none">
              Type
            </span>
            <span className="text-gray-dark text-xs font-normal leading-none mt-[2px]">
              {type}
            </span>
          </div>

          <div className="flex flex-col gap-0">
            <span className="text-gray-medium text-[8px] font-normal leading-none">
              Specificati
            </span>
            <span className="text-gray-dark text-xs font-normal leading-none mt-[2px]">
              {specifications}
            </span>
          </div>
        </div>

        <div className="px-4 pt-[9px] grid grid-cols-2 gap-x-4">
          <div className="flex flex-col gap-0">
            <span className="text-gray-medium text-[8px] font-normal leading-none">
              Suprafata
            </span>
            <span className="text-gray-dark text-xs font-normal leading-none mt-[2px]">
              {area}
            </span>
          </div>

          <div className="flex flex-col gap-0">
            <span className="text-gray-medium text-[8px] font-normal leading-none">
              Zona
            </span>
            <span className="text-gray-dark text-xs font-normal leading-none mt-[2px]">
              {zone}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-[15px] flex items-center justify-between">
        <button className="bg-primary-blue hover:bg-blue-600 transition-colors rounded h-6 px-4 flex items-center gap-2">
          <MessageSquare className="w-3 h-3 text-white" strokeWidth={1} />
          <span className="text-white font-poppins text-xs font-bold leading-none">
            {contactName}
          </span>
        </button>

        <div className="w-[35px] h-[35px] rounded-full bg-gray-light flex items-center justify-center flex-shrink-0">
          <User className="w-[14px] h-[18px] text-gray-dark" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
