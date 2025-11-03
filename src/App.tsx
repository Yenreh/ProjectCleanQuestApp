import { useState } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { ProgressPanel } from "./components/ProgressPanel";
import { ChallengesView } from "./components/ChallengesView";
import { HarmonyRoom } from "./components/HarmonyRoom";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { Home, BarChart3, Trophy, Sparkles, Settings, User, Users, ListTodo, HomeIcon, Clock, ChevronDown } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./components/ui/dropdown-menu";
import { toast } from "sonner";

type Screen = "home" | "progress" | "challenges" | "harmony";
type MasteryLevel = "novice" | "solver" | "expert" | "master" | "visionary";

export default function App() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [masteryLevel, setMasteryLevel] = useState<MasteryLevel>("novice");
  
  // Información del usuario
  const userName = "Ana";
  const userInitials = "A";

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return <HomeScreen masteryLevel={masteryLevel} />;
      case "progress":
        return <ProgressPanel masteryLevel={masteryLevel} />;
      case "challenges":
        return <ChallengesView masteryLevel={masteryLevel} />;
      case "harmony":
        return <HarmonyRoom masteryLevel={masteryLevel} />;
      default:
        return <HomeScreen masteryLevel={masteryLevel} />;
    }
  };

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return (
      <>
        <OnboardingWizard onComplete={() => setHasCompletedOnboarding(true)} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div className="size-full flex flex-col bg-[#fafaf9]">
        {/* Top Header with Mastery Level Selector */}
        <div className="bg-white border-b border-border px-6 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#6fbd9d]" />
              <span className="text-sm">CleanQuest</span>
            </div>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-[#6fbd9d] text-white text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{userName}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Mi Perfil */}
                <DropdownMenuItem onClick={() => toast.info("Abriendo perfil...")}>
                  <User className="w-4 h-4 mr-2" />
                  <span>Mi perfil</span>
                </DropdownMenuItem>

                {/* Administrar Casa - with submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <HomeIcon className="w-4 h-4 mr-2" />
                    <span>Administrar casa</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => toast.info("Gestionar tareas...")}>
                      <ListTodo className="w-4 h-4 mr-2" />
                      <span>Gestionar tareas</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Gestionar zonas...")}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      <span>Gestionar zonas</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Gestionar miembros...")}>
                      <Users className="w-4 h-4 mr-2" />
                      <span>Gestionar miembros</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Configurar recordatorios...")}>
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Recordatorios</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
                
                {/* Configuración general */}
                <DropdownMenuItem onClick={() => toast.info("Configuración general...")}>
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Configuración</span>
                </DropdownMenuItem>

                {/* Selector de nivel de maestría (DEV) */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Nivel de maestría</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setMasteryLevel("novice")}>
                  <span className={masteryLevel === "novice" ? "font-semibold" : ""}>Novato</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMasteryLevel("solver")}>
                  <span className={masteryLevel === "solver" ? "font-semibold" : ""}>Solucionador</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMasteryLevel("expert")}>
                  <span className={masteryLevel === "expert" ? "font-semibold" : ""}>Experto</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMasteryLevel("master")}>
                  <span className={masteryLevel === "master" ? "font-semibold" : ""}>Maestro</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMasteryLevel("visionary")}>
                  <span className={masteryLevel === "visionary" ? "font-semibold" : ""}>Visionario</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto pb-20">
          {renderScreen()}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-around">
              <button
                onClick={() => setCurrentScreen("home")}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
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
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
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
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
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
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
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
      <Toaster />
    </>
  );
}
