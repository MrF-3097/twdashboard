import { ArrowLeft, Check, User, Home, DollarSign, MapPin, Mail, Phone } from "lucide-react";
import { useState } from "react";

interface AddClientFlowProps {
  onBack: () => void;
  onComplete: () => void;
}

export function AddClientFlow({ onBack, onComplete }: AddClientFlowProps) {
  const [step, setStep] = useState(1);
  const [clientType, setClientType] = useState<"buyer" | "renter" | null>(null);
  const [propertyType, setPropertyType] = useState<"house" | "apartment" | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    budgetMin: "",
    budgetMax: "",
    preferredArea: ""
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleSubmit = () => {
    // In production, submit to API
    onComplete();
  };

  const canProceedStep1 = clientType !== null;
  const canProceedStep2 = propertyType !== null;
  const canProceedStep3 = formData.name && formData.email && formData.phone && formData.budgetMin;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border/50 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-secondary rounded-xl transition-colors active:scale-95"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg text-foreground">Add New Client</h1>
            <p className="text-xs text-muted-foreground">Step {step} of {totalSteps}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-secondary/30">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Step 1: Client Type */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl text-foreground mb-2">What type of client?</h2>
              <p className="text-sm text-muted-foreground">Select the client's intent</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setClientType("buyer")}
                className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left active:scale-98 ${
                  clientType === "buyer"
                    ? "border-primary bg-blue-50 shadow-md"
                    : "border-border/50 bg-white hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    clientType === "buyer" ? "bg-primary" : "bg-secondary"
                  }`}>
                    <DollarSign className={`h-6 w-6 ${clientType === "buyer" ? "text-white" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-foreground mb-1">Buyer</h3>
                    <p className="text-sm text-muted-foreground">Looking to purchase property</p>
                  </div>
                  {clientType === "buyer" && (
                    <Check className="h-6 w-6 text-primary animate-in zoom-in duration-200" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setClientType("renter")}
                className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left active:scale-98 ${
                  clientType === "renter"
                    ? "border-primary bg-blue-50 shadow-md"
                    : "border-border/50 bg-white hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    clientType === "renter" ? "bg-primary" : "bg-secondary"
                  }`}>
                    <User className={`h-6 w-6 ${clientType === "renter" ? "text-white" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-foreground mb-1">Renter</h3>
                    <p className="text-sm text-muted-foreground">Looking to rent property</p>
                  </div>
                  {clientType === "renter" && (
                    <Check className="h-6 w-6 text-primary animate-in zoom-in duration-200" />
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Property Type */}
        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl text-foreground mb-2">Property preference?</h2>
              <p className="text-sm text-muted-foreground">What are they looking for?</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setPropertyType("house")}
                className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left active:scale-98 ${
                  propertyType === "house"
                    ? "border-primary bg-blue-50 shadow-md"
                    : "border-border/50 bg-white hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    propertyType === "house" ? "bg-primary" : "bg-secondary"
                  }`}>
                    <Home className={`h-6 w-6 ${propertyType === "house" ? "text-white" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-foreground mb-1">House</h3>
                    <p className="text-sm text-muted-foreground">Single family home, villa, townhouse</p>
                  </div>
                  {propertyType === "house" && (
                    <Check className="h-6 w-6 text-primary animate-in zoom-in duration-200" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setPropertyType("apartment")}
                className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left active:scale-98 ${
                  propertyType === "apartment"
                    ? "border-primary bg-blue-50 shadow-md"
                    : "border-border/50 bg-white hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    propertyType === "apartment" ? "bg-primary" : "bg-secondary"
                  }`}>
                    <Home className={`h-6 w-6 ${propertyType === "apartment" ? "text-white" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-foreground mb-1">Apartment</h3>
                    <p className="text-sm text-muted-foreground">Condo, flat, studio</p>
                  </div>
                  {propertyType === "apartment" && (
                    <Check className="h-6 w-6 text-primary animate-in zoom-in duration-200" />
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Client Details */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl text-foreground mb-2">Client details</h2>
              <p className="text-sm text-muted-foreground">Basic information and preferences</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-foreground mb-2">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-border/50 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-foreground mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-border/50 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-foreground mb-2">Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-border/50 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-foreground mb-2">Budget Range *</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.budgetMin}
                      onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                      placeholder="Min"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-border/50 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.budgetMax}
                      onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                      placeholder="Max"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-border/50 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-foreground mb-2">Preferred Area</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.preferredArea}
                    onChange={(e) => setFormData({ ...formData, preferredArea: e.target.value })}
                    placeholder="Downtown, Midtown, etc."
                    className="w-full pl-11 pr-4 py-3 bg-white border border-border/50 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border/50 shadow-2xl">
        <button
          onClick={step === totalSteps ? handleSubmit : handleNext}
          disabled={
            (step === 1 && !canProceedStep1) ||
            (step === 2 && !canProceedStep2) ||
            (step === 3 && !canProceedStep3)
          }
          className={`w-full py-4 rounded-xl transition-all duration-200 ${
            ((step === 1 && canProceedStep1) ||
            (step === 2 && canProceedStep2) ||
            (step === 3 && canProceedStep3))
              ? "bg-primary text-white shadow-lg active:scale-98"
              : "bg-secondary/50 text-muted-foreground cursor-not-allowed"
          }`}
        >
          <span className="text-sm">
            {step === totalSteps ? "Add Client" : "Continue"}
          </span>
        </button>
      </div>
    </div>
  );
}
