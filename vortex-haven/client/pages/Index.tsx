import PropertyCard from "@/components/PropertyCard";

export default function Index() {
  const properties = [
    {
      budget: "€180K",
      budgetExtra: "+ €20K",
      type: "Casa/apt",
      specifications: "3 camere, 2 bai",
      area: "135 mp",
      zone: "Sub Arini",
      contactName: "Sorin",
    },
    {
      budget: "€250K",
      budgetExtra: "+ €15K",
      type: "Apartament",
      specifications: "4 camere, 3 bai",
      area: "180 mp",
      zone: "Centru",
      contactName: "Maria",
    },
    {
      budget: "€120K",
      type: "Casa",
      specifications: "2 camere, 1 bai",
      area: "95 mp",
      zone: "Floresti",
      contactName: "Alex",
    },
    {
      budget: "€320K",
      budgetExtra: "+ €30K",
      type: "Vila",
      specifications: "5 camere, 4 bai",
      area: "250 mp",
      zone: "Buna Ziua",
      contactName: "Ion",
    },
    {
      budget: "€95K",
      type: "Apartament",
      specifications: "2 camere, 1 bai",
      area: "65 mp",
      zone: "Manastur",
      contactName: "Ana",
    },
    {
      budget: "€410K",
      budgetExtra: "+ €40K",
      type: "Casa",
      specifications: "6 camere, 5 bai",
      area: "320 mp",
      zone: "Grigorescu",
      contactName: "David",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-dark mb-4">
              Proprietăți Disponibile
            </h1>
            <p className="text-lg text-gray-medium max-w-2xl mx-auto">
              Descoperă cele mai bune oferte imobiliare din Cluj-Napoca și împrejurimi
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {properties.map((property, index) => (
              <PropertyCard key={index} {...property} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
