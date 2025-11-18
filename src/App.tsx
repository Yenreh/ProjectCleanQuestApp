import { useState, useEffect } from "react";
import { HomeView } from "./components/panels/HomeView";
import { ProgressView } from "./components/panels/ProgressView";
import { ChallengesView } from "./components/panels/ChallengesView";
import { HarmonyView } from "./components/panels/HarmonyView";
import { OnboardingView } from "./components/panels/OnboardingView";
import { AuthView } from "./components/panels/AuthView";
import { ProfileSettingsDialog } from "./components/dialogs/ProfileSettingsDialog";
import { HomeManagementDialog } from "./components/dialogs/HomeManagementDialog";
import { GeneralSettingsDialog } from "./components/dialogs/GeneralSettingsDialog";
import { ChangeHomeConfirmDialog } from "./components/dialogs/ChangeHomeConfirmDialog";
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
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  
  // User and home data
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentHome, setCurrentHome] = useState<HomeType | null>(null);
  const [currentMember, setCurrentMember] = useState<HomeMember | null>(null);
  
  // Settings modals state
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [homeManagementOpen, setHomeManagementOpen] = useState(false);
  const [generalSettingsOpen, setGeneralSettingsOpen] = useState(false);
  
  // Change home confirmation dialog state
  const [showChangeHomeDialog, setShowChangeHomeDialog] = useState(false);
  const [changeHomeData, setChangeHomeData] = useState<{
    token: string;
    currentHomeName: string;
    newHomeName: string;
  } | null>(null);
  const [isChangingHome, setIsChangingHome] = useState(false);
  
  // Información del usuario
  const userName = currentUser?.full_name || currentUser?.email?.split('@')[0] || "Usuario";
  const userInitials = userName.substring(0, 2).toUpperCase();

  // Check for invitation token in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (token) {
      setInvitationToken(token);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // If user is already authenticated, check if they have an active home
      (async () => {
        const user = await db.getCurrentUser();
        if (user) {
          // Check if user already has an active membership
          const { member, home } = await db.getUserHomeMembership(user.id);
          
          if (member && home) {
            // User already has a home, show confirmation dialog
            const invitationInfo = await db.getInvitationByToken(token);
            if (invitationInfo) {
              setChangeHomeData({
                token,
                currentHomeName: home.name,
                newHomeName: invitationInfo.homes.name
              });
              setShowChangeHomeDialog(true);
            }
          } else {
            // User doesn't have a home, accept invitation directly
            try {
              await db.acceptInvitation(token, user.id);
              toast.success('¡Te has unido al hogar!');
              setInvitationToken(null);
              await loadUserData(user.id);
            } catch (error: any) {
              console.error('Error accepting invitation:', error);
              toast.error(error.message || 'Error al aceptar la invitación');
            }
          }
        }
      })();
    }
  }, []);

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
      let profile = await db.getProfile(userId);
      if (!profile) {
        setIsLoading(false);
        return;
      }
      
      setCurrentUser(profile);
      
      // Check if user has a pending invitation by token
      if (invitationToken) {
        try {
          // Accept invitation if token is present
          await db.acceptInvitation(invitationToken, userId);
          toast.success('¡Te has unido al hogar!');
          setInvitationToken(null);
          
          // Reload profile after accepting invitation to get updated onboarding status
          const updatedProfile = await db.getProfile(userId);
          if (updatedProfile) {
            profile = updatedProfile;
            setCurrentUser(updatedProfile);
          }
        } catch (error) {
          console.error('Error accepting invitation:', error);
          toast.error('Error al aceptar la invitación');
        }
      }
      
      // Check onboarding status from profile
      if (profile.has_completed_onboarding) {
        // Load home membership data
        const { member, home } = await db.getUserHomeMembership(userId);
        
        if (member && home) {
          setHasCompletedOnboarding(true);
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
          
          // Update level in database if changed silently
          // No mostramos toast aquí porque ya se mostró cuando se completó la tarea
          if (previousLevel !== newLevel) {
            await db.updateMemberMasteryLevel(member.id, newLevel);
          }
        } else {
          // Profile says onboarding is complete but no active membership found
          // This happens when user is removed from a home
          // Force them to go through onboarding again
          setHasCompletedOnboarding(false);
          toast.info('Has sido removido del hogar. Debes crear uno nuevo o unirte a otro.');
        }
      } else {
        // User needs to complete onboarding
        setHasCompletedOnboarding(false);
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

  const handleConfirmChangeHome = async () => {
    if (!changeHomeData || !currentUser) return;

    setIsChangingHome(true);
    try {
      await db.acceptInvitation(changeHomeData.token, currentUser.id);
      toast.success('¡Te has cambiado de casa exitosamente!');
      setInvitationToken(null);
      setShowChangeHomeDialog(false);
      setChangeHomeData(null);
      await loadUserData(currentUser.id);
    } catch (error: any) {
      console.error('Error changing home:', error);
      toast.error(error.message || 'Error al cambiar de casa');
    } finally {
      setIsChangingHome(false);
    }
  };

  const handleCancelChangeHome = () => {
    setShowChangeHomeDialog(false);
    setChangeHomeData(null);
    setInvitationToken(null);
    toast.info('Has permanecido en tu casa actual');
  };

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
      <AuthView 
        onSuccess={() => setIsAuthenticated(true)} 
        invitationToken={invitationToken}
      />
    );
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return (
      <OnboardingView onComplete={handleOnboardingComplete} />
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return <HomeView masteryLevel={masteryLevel} currentMember={currentMember} currentUser={currentUser} homeId={currentHome?.id} />;
      case "progress":
        return <ProgressView masteryLevel={masteryLevel} currentMember={currentMember} homeId={currentHome?.id} />;
      case "challenges":
        return <ChallengesView masteryLevel={masteryLevel} currentMember={currentMember} homeId={currentHome?.id} />;
      case "harmony":
        return <HarmonyView masteryLevel={masteryLevel} currentMember={currentMember} homeId={currentHome?.id} />;
      default:
        return <HomeView masteryLevel={masteryLevel} currentMember={currentMember} currentUser={currentUser} homeId={currentHome?.id} />;
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
                <DropdownMenuItem onClick={() => setProfileSettingsOpen(true)}>
                  <User className="w-4 h-4 mr-2" />
                  <span>Mi perfil</span>
                </DropdownMenuItem>

                {/* Administrar Casa - with submenu */}
                {/* Gestión del hogar */}
                <DropdownMenuItem onClick={() => setHomeManagementOpen(true)}>
                  <HomeIcon className="w-4 h-4 mr-2" />
                  <span>Gestionar hogar</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                
                {/* Configuración general */}
                <DropdownMenuItem onClick={() => setGeneralSettingsOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Configuración</span>
                </DropdownMenuItem>

                {/* Selector de nivel de maestría (solo en modo DEV) */}
                {(import.meta as any).env?.VITE_DEV_MODE === 'true' && (
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

      {/* Profile Settings Dialog */}
      <ProfileSettingsDialog
        open={profileSettingsOpen}
        onOpenChange={setProfileSettingsOpen}
        currentMember={currentMember}
        currentHome={currentHome}
        onUpdate={() => {
          if (currentUser?.id) loadUserData(currentUser.id);
        }}
      />

      {/* Home Management Dialog */}
      <HomeManagementDialog
        open={homeManagementOpen}
        onOpenChange={setHomeManagementOpen}
        homeId={currentHome?.id || null}
        currentMember={currentMember}
        currentHome={currentHome}
        onUpdate={() => {
          if (currentUser?.id) loadUserData(currentUser.id);
        }}
      />

      {/* General Settings Dialog */}
      <GeneralSettingsDialog
        open={generalSettingsOpen}
        onOpenChange={setGeneralSettingsOpen}
        currentMember={currentMember}
        onUpdate={() => {
          if (currentUser?.id) loadUserData(currentUser.id);
        }}
      />

      {/* Change Home Confirmation Dialog */}
      {changeHomeData && (
        <ChangeHomeConfirmDialog
          open={showChangeHomeDialog}
          onOpenChange={setShowChangeHomeDialog}
          currentHomeName={changeHomeData.currentHomeName}
          newHomeName={changeHomeData.newHomeName}
          onConfirm={handleConfirmChangeHome}
          onCancel={handleCancelChangeHome}
          isLoading={isChangingHome}
        />
      )}

      <Toaster />
    </>
  );
}
