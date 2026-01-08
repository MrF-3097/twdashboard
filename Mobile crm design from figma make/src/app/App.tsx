import { TopNavigation } from "./components/TopNavigation";
import { SidebarNavigation } from "./components/SidebarNavigation";
import { PriorityOverview } from "./components/PriorityOverview";
import { PriorityInbox } from "./components/PriorityInbox";
import { RecentClientsTable } from "./components/RecentClientsTable";
import { PerformanceMetrics } from "./components/PerformanceMetrics";
import { ActiveLeads } from "./components/ActiveLeads";
import { ClientProfile } from "./components/ClientProfile";
import { MobileApp } from "./components/mobile/MobileApp";
import { useState, useEffect } from "react";

export default function App() {
  const [currentView, setCurrentView] = useState<"dashboard" | "client-profile">("dashboard");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClientClick = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentView("client-profile");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedClientId(null);
  };

  // Mobile view
  if (isMobile) {
    return <MobileApp />;
  }

  // Desktop view
  if (currentView === "client-profile" && selectedClientId) {
    return <ClientProfile clientId={selectedClientId} onBack={handleBackToDashboard} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <TopNavigation />
      
      {/* Sidebar Navigation */}
      <SidebarNavigation />
      
      {/* Main Dashboard Content - offset by sidebar */}
      <main className="ml-64 pt-[73px]">
        <div className="p-6 space-y-6">
          {/* Priority Overview - Horizontal Card Row */}
          <PriorityOverview />
          
          {/* Action Queue - "Today" Section */}
          <PriorityInbox />
          
          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Clients and Leads */}
            <RecentClientsTable onClientClick={handleClientClick} />
            
            {/* Active Leads */}
            <ActiveLeads />
          </div>
          
          {/* Performance Snapshot */}
          <PerformanceMetrics />
        </div>
      </main>
    </div>
  );
}