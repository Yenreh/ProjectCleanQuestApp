import { useState } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { ProgressPanel } from "./components/ProgressPanel";
import { ChallengesView } from "./components/ChallengesView";
import { HarmonyRoom } from "./components/HarmonyRoom";
import { Home, BarChart3, Trophy, Sparkles } from "lucide-react";

type Screen = "home" | "progress" | "challenges" | "harmony";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return <HomeScreen />;
      case "progress":
        return <ProgressPanel />;
      case "challenges":
        return <ChallengesView />;
      case "harmony":
        return <HarmonyRoom />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="size-full flex flex-col bg-[#fafaf9]">
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto pb-20">
        {renderScreen()}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <div className="flex items-center justify-around">
            <button
              onClick={() => setCurrentScreen("home")}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                currentScreen === "home"
                  ? "text-[#6fbd9d] bg-[#e9f5f0]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Inicio</span>
            </button>

            <button
              onClick={() => setCurrentScreen("progress")}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                currentScreen === "progress"
                  ? "text-[#6fbd9d] bg-[#e9f5f0]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">Progreso</span>
            </button>

            <button
              onClick={() => setCurrentScreen("challenges")}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                currentScreen === "challenges"
                  ? "text-[#6fbd9d] bg-[#e9f5f0]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="text-xs">Desafíos</span>
            </button>

            <button
              onClick={() => setCurrentScreen("harmony")}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                currentScreen === "harmony"
                  ? "text-[#6fbd9d] bg-[#e9f5f0]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-xs">Armonía</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
