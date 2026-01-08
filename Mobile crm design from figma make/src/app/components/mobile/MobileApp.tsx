import { useState } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { HomeScreen } from "./HomeScreen";
import { ClientsScreen } from "./ClientsScreen";
import { PropertiesScreen } from "./PropertiesScreen";
import { AddClientFlow } from "./AddClientFlow";
import { LeaderboardScreen } from "./LeaderboardScreen";
import { CheckCircle } from "lucide-react";

export function MobileApp() {
  const [activeScreen, setActiveScreen] = useState<string>("home");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleNavigate = (screen: string) => {
    setActiveScreen(screen);
  };

  const handleAddClientComplete = () => {
    setShowSuccessMessage(true);
    setActiveScreen("home");
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleTabChange = (tab: string) => {
    if (tab === "add") {
      setActiveScreen("add-client");
    } else {
      setActiveScreen(tab);
    }
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case "home":
        return <HomeScreen onNavigate={handleNavigate} />;
      case "clients":
        return <ClientsScreen />;
      case "add-client":
        return (
          <AddClientFlow
            onBack={() => setActiveScreen("home")}
            onComplete={handleAddClientComplete}
          />
        );
      case "properties":
        return <PropertiesScreen />; // Placeholder - would be PropertiesScreen
      case "leaderboard":
        return <LeaderboardScreen />;
      default:
        return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Success Toast */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-green-500 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Client added successfully!</p>
              <p className="text-sm text-white/90">You earned 25 points</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="min-h-screen">
        {renderScreen()}
      </main>

      {/* Bottom Navigation - Hidden during add flows */}
      {!activeScreen.startsWith("add-") && (
        <BottomNavigation
          activeTab={activeScreen === "add-client" ? "add" : activeScreen}
          onTabChange={handleTabChange}
        />
      )}
    </div>
  );
}