import { useState, useEffect } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { ProgressPanel } from "./components/ProgressPanel";
import { ChallengesView } from "./components/ChallengesView";
import { HarmonyRoom } from "./components/HarmonyRoom";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { AuthScreen } from "./components/AuthScreen";
import { Home, BarChart3, Trophy, Sparkles, Settings, User, Users, ListTodo, HomeIcon, Clock, ChevronDown, LogOut } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
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
import { db } from "./lib/db";
import { calculateMasteryLevel, checkLevelUp, getLevelFeatures } from "./lib/masteryService";
import type { MasteryLevel } from "./lib/masteryService";
import type { Profile, Home as HomeType, HomeMember } from "./lib/types";

type Screen = "home" | "progress" | "challenges" | "harmony";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [masteryLevel, setMasteryLevel] = useState<MasteryLevel>("novice");
  
  // User and home data
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentHome, setCurrentHome] = useState<HomeType | null>(null);
  const [currentMember, setCurrentMember] = useState<HomeMember | null>(null);
  
  // Información del usuario
  const userName = currentUser?.full_name || currentUser?.email?.split('@')[0] || "Usuario";
  const userInitials = userName.substring(0, 2).toUpperCase();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
    
    // Subscribe to auth changes
    const subscription = db.onAuthStateChange((userId) => {
      if (userId) {
        setIsAuthenticated(true);
        loadUserData(userId);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setCurrentHome(null);
        setCurrentMember(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  async function checkAuth() {
    setIsLoading(true);
    try {
      const user = await db.getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
        await loadUserData(user.id);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const loadUserData = async (userId: string) => {
    try {
      // Get user profile
      const profile = await db.getProfile(userId);
      if (profile) {
        setCurrentUser(profile);
        
        // Check onboarding status from profile
        if (profile.has_completed_onboarding) {
          setHasCompletedOnboarding(true);
          
          // Load home membership data
          const { member, home } = await db.getUserHomeMembership(userId);
          
          if (member && home) {
            setCurrentHome(home);
            setCurrentMember(member);
            
            // Get member achievements count for mastery calculation
            const achievementsCount = await db.getMemberAchievementsCount(member.id);
            
            // Calculate mastery level
            const previousLevel = member.mastery_level as MasteryLevel;
            const newLevel = calculateMasteryLevel({
              totalPoints: member.total_points || 0,
              achievementsUnlocked: achievementsCount,
              weeksActive: member.weeks_active || 0,
              tasksCompleted: member.tasks_completed || 0
            });
            
            setMasteryLevel(newLevel);
            
            // Update level in database if changed
            if (previousLevel !== newLevel) {
              await db.updateMemberMasteryLevel(member.id, newLevel);
              
              // Check if user leveled up (not down)
              if (checkLevelUp(previousLevel, newLevel)) {
                const features = getLevelFeatures(newLevel);
                toast.success(`¡Nivel desbloqueado!`, {
                  description: `Has alcanzado nuevas capacidades. Características desbloqueadas:\n${features.slice(0, 2).join('\n')}`
                });
              }
            }
          }
        } else {
          // User needs to complete onboarding
          setHasCompletedOnboarding(false);
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await db.signOut();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentHome(null);
      setCurrentMember(null);
      setHasCompletedOnboarding(false);
      toast.success("Sesión cerrada");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Error al cerrar sesión");
    }
  }

  async function handleOnboardingComplete() {
    // Reload user data so we read the newly created home/tasks from backend
    if (currentUser) {
      await loadUserData(currentUser.id);
      // `loadUserData` will set `hasCompletedOnboarding` based on DB state
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-[#6fbd9d] animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show auth screen
  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen onSuccess={() => setIsAuthenticated(true)} />
        <Toaster />
      </>
    );
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return (
      <>
        <OnboardingWizard onComplete={handleOnboardingComplete} />
        <Toaster />
      </>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return <HomeScreen masteryLevel={masteryLevel} currentMember={currentMember} homeId={currentHome?.id} />;
      case "progress":
        return <ProgressPanel masteryLevel={masteryLevel} currentMember={currentMember} homeId={currentHome?.id} />;
      case "challenges":
        return <ChallengesView masteryLevel={masteryLevel} currentMember={currentMember} homeId={currentHome?.id} />;
      case "harmony":
        return <HarmonyRoom masteryLevel={masteryLevel} currentMember={currentMember} homeId={currentHome?.id} />;
      default:
        return <HomeScreen masteryLevel={masteryLevel} currentMember={currentMember} homeId={currentHome?.id} />;
    }
  };

  return (
    <>
      <div className="size-full flex flex-col bg-[#fafaf9]">
        {/* Top Header with Mastery Level Selector */}
        <div className="bg-white border-b border-border px-6 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#6fbd9d]" />
              <span className="text-sm">CleanQuest</span>
              {currentHome && (
                <>
                  <span className="text-muted-foreground text-sm">•</span>
                  <span className="text-sm text-muted-foreground">{currentHome.name}</span>
                </>
              )}
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

                {/* Selector de nivel de maestría (solo en modo DEV) */}
                {import.meta.env.VITE_DEV_MODE === 'true' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      DEV: Selector de nivel
                    </DropdownMenuLabel>
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
                  </>
                )}

                <DropdownMenuSeparator />
                
                {/* Cerrar sesión */}
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Cerrar sesión</span>
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
