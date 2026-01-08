import { MapPin, DollarSign, Home, Bed, Bath, Square, Search, Filter } from "lucide-react";
import { useState, useEffect } from "react";

export function PropertiesScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const properties = [
    {
      id: "1",
      name: "Modern Villa",
      address: "123 Oak Street, Downtown",
      price: "$850,000",
      type: "For Sale",
      typeColor: "bg-green-100 text-green-700 border-green-200",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
      beds: 4,
      baths: 3,
      sqft: "2,400",
      status: "Active"
    },
    {
      id: "2",
      name: "Downtown Condo",
      address: "456 Main Avenue, Midtown",
      price: "$720,000",
      type: "For Sale",
      typeColor: "bg-green-100 text-green-700 border-green-200",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
      beds: 2,
      baths: 2,
      sqft: "1,200",
      status: "Active"
    },
    {
      id: "3",
      name: "Luxury Apartment",
      address: "789 Park Lane, Uptown",
      price: "$3,500/mo",
      type: "For Rent",
      typeColor: "bg-blue-100 text-blue-700 border-blue-200",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
      beds: 3,
      baths: 2,
      sqft: "1,800",
      status: "Available"
    },
    {
      id: "4",
      name: "Suburban House",
      address: "321 Maple Drive, Suburbs",
      price: "$680,000",
      type: "For Sale",
      typeColor: "bg-green-100 text-green-700 border-green-200",
      image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop",
      beds: 3,
      baths: 2.5,
      sqft: "2,100",
      status: "Pending"
    }
  ];

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-24 pt-4 px-4">
      {/* Header */}
      <div className={`mb-6 animate-in slide-in-from-top-4 duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className="text-2xl text-foreground mb-1">Properties</h1>
        <p className="text-sm text-muted-foreground">{properties.length} total listings</p>
      </div>

      {/* Search Bar */}
      <div className={`mb-4 animate-in slide-in-from-top-5 duration-500 delay-100 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search properties..."
            className="w-full pl-11 pr-12 py-3 bg-white border border-border/50 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <Filter className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Property Cards */}
      <div className="space-y-4">
        {filteredProperties.map((property, index) => (
          <div
            key={property.id}
            className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden active:scale-98 transition-all duration-200 animate-in slide-in-from-left-4"
            style={{ animationDelay: `${200 + index * 50}ms` }}
          >
            {/* Property Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={property.image}
                alt={property.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs border ${property.typeColor} bg-white/95 backdrop-blur-sm shadow-sm`}>
                  {property.type}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-white/95 backdrop-blur-sm text-foreground shadow-sm">
                  {property.status}
                </span>
              </div>
              <div className="absolute bottom-3 right-3 bg-primary text-white px-3 py-2 rounded-xl shadow-lg backdrop-blur-sm">
                <p className="text-sm">{property.price}</p>
              </div>
            </div>

            {/* Property Info */}
            <div className="p-4">
              <h3 className="text-foreground mb-1">{property.name}</h3>
              <div className="flex items-start gap-1.5 mb-3">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{property.address}</p>
              </div>

              {/* Property Features */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Bed className="h-4 w-4" />
                  <span>{property.beds} beds</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Bath className="h-4 w-4" />
                  <span>{property.baths} baths</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Square className="h-4 w-4" />
                  <span>{property.sqft} sqft</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <Home className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-20" />
          <p className="text-muted-foreground">No properties found</p>
        </div>
      )}
    </div>
  );
}
