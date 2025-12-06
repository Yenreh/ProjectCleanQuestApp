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
import { NotificationsDialog } from "./components/dialogs/NotificationsDialog";
import { Home, BarChart3, Trophy, Sparkles, Settings, User, Users, ListTodo, HomeIcon, Clock, ChevronDown, LogOut, Bell, BellDot } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { Button } from "./components/ui/button";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Badge } from "./components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { db } from "./lib/db";
import { getLevelFeatures } from "./lib/masteryService";
import type { MasteryLevel } from "./lib/masteryService";
import { Notification, InvitationNotification } from "./lib/notifications";
// Zustand stores
import { 
  useAuthStore, 
  useHomeStore,
  useMembersStore,
  useMasteryStore,
  useNotificationStore, 
  useInvitationStore, 
  useUIStore 
} from "./stores";

export default function App() {
  // Zustand stores
  const { currentUser, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { currentHome, loadHomeData } = useHomeStore();
  const { currentMember, members } = useMembersStore();
  const { masteryLevel } = useMasteryStore();
  const { notifications, unreadCount, loadNotifications } = useNotificationStore();
  const { 
    invitationToken, 
    changeHomeData, 
    showChangeHomeDialog, 
    isProcessing: isChangingHome,
    setShowChangeHomeDialog,
    setChangeHomeData,
    processInvitation,
    acceptHomeChange,
    declineHomeChange,
    clearInvitationData,
    checkPendingInvitationByEmail
  } = useInvitationStore();
  const {
    currentScreen,
    profileSettingsOpen,
    homeManagementOpen,
    generalSettingsOpen,
    notificationsDialogOpen,
    setCurrentScreen,
    setProfileSettingsOpen,
    setHomeManagementOpen,
    setGeneralSettingsOpen,
    setNotificationsDialogOpen
  } = useUIStore();
  
  // Local state for onboarding
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  
  // Información del usuario
  const userName = currentUser?.full_name || currentUser?.email?.split('@')[0] || "Usuario";
  const userInitials = userName.substring(0, 2).toUpperCase();

  // Setup notifications when user email or member changes
  useEffect(() => {
    const { setUserEmail, setCurrentMemberId } = useNotificationStore.getState();
    if (currentUser?.email) {
      setUserEmail(currentUser.email);
    } else {
      setUserEmail(null);
    }
    // Also set member ID for swap request notifications
    if (currentMember?.id) {
      setCurrentMemberId(currentMember.id);
    } else {
      setCurrentMemberId(null);
    }
  }, [currentUser?.email, currentMember?.id]);

  // Check for pending invitations when currentUser is loaded
  useEffect(() => {
    const checkInvitations = async () => {
      if (!currentUser?.email) return;
      
      const { currentHome } = useHomeStore.getState();
      const { currentMember } = useMembersStore.getState();
      
      // Only check if user has no home
      if (currentHome || currentMember) return;
      
      await checkPendingInvitationByEmail(currentUser.email);
    };
    
    checkInvitations();
  }, [currentUser?.email, checkPendingInvitationByEmail]);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
    
    // Subscribe to auth changes
    const subscription = db.onAuthStateChange((userId) => {
      if (userId) {
        loadUserData(userId);
      } else {
        setHasCompletedOnboarding(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Load home data using store (this also checks onboarding)
      await loadHomeData(userId);
      
      // Get updated store values after loading
      const { currentHome: updatedHome } = useHomeStore.getState();
      const { currentMember: updatedMember } = useMembersStore.getState();
      
      // Check if user has completed onboarding
      if (updatedHome && updatedMember) {
        setHasCompletedOnboarding(true);
        
        // Auto-check and start new cycle if needed
        const cycleResult = await db.checkAndStartNewCycleIfNeeded(updatedHome.id);
        if (cycleResult.newCycleStarted) {
          toast.success(`Nuevo ciclo iniciado con ${cycleResult.assignments} tareas asignadas`);
          // Reload home data to refresh the view
          await loadHomeData(userId);
        }
      } else {
        // Check if there's a pending invitation from store
        if (invitationToken) {
          try {
            const invitationInfo = await db.getInvitationByToken(invitationToken);
            if (invitationInfo) {
              const { member, home } = await db.getUserHomeMembership(userId);
              const ownerName = invitationInfo.homes.profiles?.full_name || invitationInfo.homes.profiles?.email;
              
              // Get current home owner if user has a home
              let currentHomeOwner: string | undefined;
              if (home) {
                // Use existing members if available, otherwise fetch
                if (members.length > 0) {
                  const currentOwner = members.find(m => m.role === 'owner');
                  currentHomeOwner = currentOwner?.full_name || currentOwner?.email;
                } else {
                  const currentHomeMembers = await db.getHomeMembers(home.id);
                  const currentOwner = currentHomeMembers.find(m => m.role === 'owner');
                  currentHomeOwner = currentOwner?.full_name || currentOwner?.email;
                }
              }
              
              setChangeHomeData({
                invitationId: invitationInfo.id,
                token: invitationToken,
                currentHomeName: member && home ? home.name : null,
                currentHomeOwner,
                newHomeName: invitationInfo.homes.name,
                newHomeOwner: ownerName
              });
              setShowChangeHomeDialog(true);
              return;
            } else {
              clearInvitationData();
              toast.error('El enlace de invitación no es válido o ha expirado');
            }
          } catch (error) {
            console.error('Error checking invitation:', error);
            clearInvitationData();
          }
        }
        
        // Email invitation check is now handled by useEffect watching currentUser
        setHasCompletedOnboarding(false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsCheckingOnboarding(false);
    }
  }

  async function handleSignOut() {
    try {
      const { signOut } = useAuthStore.getState();
      const { clearHomeData } = useHomeStore.getState();
      
      await signOut();
      clearHomeData();
      clearInvitationData();
      setHasCompletedOnboarding(false);
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Error al cerrar sesión");
    }
  }

  const handleConfirmChangeHome = async () => {
    if (!changeHomeData || !currentUser) return;

    try {
      await acceptHomeChange(currentUser.id);
      
      // Reload user data
      await loadUserData(currentUser.id);
      
      // Refresh notifications
      await loadNotifications();
    } catch (error) {
      console.error('Error changing home:', error);
    }
  };

  const handleCancelChangeHome = async () => {
    if (!changeHomeData) return;

    try {
      await declineHomeChange(currentHome?.name || null);
      
      // Refresh notifications
      await loadNotifications();
      
      // If user has home, reload data
      if (currentUser && currentHome) {
        await loadUserData(currentUser.id);
      }
    } catch (error) {
      console.error('Error canceling invitation:', error);
    }
  };

  async function handleOnboardingComplete() {
    if (currentUser) {
      await loadUserData(currentUser.id);
    }
  }

  // Handler for notification actions
  const handleNotificationAction = (notification: Notification) => {
    if (notification.type === 'invitation') {
      const invNotification = notification as InvitationNotification;
      
      // Get current home owner
      const currentOwner = members.find(m => m.role === 'owner');
      const currentHomeOwner = currentOwner?.full_name || currentOwner?.email;
      
      setChangeHomeData({
        invitationId: invNotification.data.invitationId,
        token: invNotification.data.token,
        currentHomeName: currentHome?.name || null,
        currentHomeOwner,
        newHomeName: invNotification.data.homeName,
        newHomeOwner: invNotification.data.ownerName
      });
      setNotificationsDialogOpen(false);
      setShowChangeHomeDialog(true);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="text-center">
          <img src="/favicon.svg" alt="Logo" className="w-20 h-20 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show auth screen
  if (!isAuthenticated) {
    return (
      <AuthView 
        onSuccess={() => { /* Auth handled by store */ }} 
        invitationToken={invitationToken}
      />
    );
  }

  // If authenticated but we don't have user data yet, keep loading
  // This prevents the flash of onboarding screen while data loads
  if (!currentUser || isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="text-center">
          <img src="/favicon.svg" alt="Logo" className="w-20 h-20 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isCheckingOnboarding ? "Verificando hogar..." : "Cargando perfil..."}
          </p>
        </div>
      </div>
    );
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return (
      <>
        <OnboardingView onComplete={handleOnboardingComplete} />
        
        {/* Change Home Confirmation Dialog - must be rendered even during onboarding */}
        {changeHomeData && (
          <ChangeHomeConfirmDialog
            open={showChangeHomeDialog}
            onOpenChange={(open) => {
              // Prevent closing dialog with external clicks
              if (!open && !isChangingHome) {
                // Only allow closing via cancel button
                return;
              }
              setShowChangeHomeDialog(open);
            }}
            currentHomeName={changeHomeData.currentHomeName}
            currentHomeOwner={changeHomeData.currentHomeOwner}
            newHomeName={changeHomeData.newHomeName}
            newHomeOwner={changeHomeData.newHomeOwner}
            onConfirm={handleConfirmChangeHome}
            onCancel={handleCancelChangeHome}
            isLoading={isChangingHome}
          />
        )}
      </>
    );
  }

  const renderScreen = () => {
    const handleLevelUpdate = async (newLevel: MasteryLevel) => {
      const { setMasteryLevel } = useMasteryStore.getState();
      setMasteryLevel(newLevel);
      
      // Update in database if member exists
      if (currentMember) {
        await db.updateMemberMasteryLevel(currentMember.id, newLevel);
      }
    };

    switch (currentScreen) {
      case "home":
        return <HomeView masteryLevel={masteryLevel} currentMember={currentMember} currentUser={currentUser} homeId={currentHome?.id} onLevelUpdate={handleLevelUpdate} />;
      case "progress":
        return <ProgressView masteryLevel={masteryLevel} currentMember={currentMember} homeId={currentHome?.id} />;
      case "challenges":
        return <ChallengesView masteryLevel={masteryLevel} currentMember={currentMember} homeId={currentHome?.id} />;
      case "harmony":
        return <HarmonyView masteryLevel={masteryLevel} currentMember={currentMember} homeId={currentHome?.id} />;
      default:
        return <HomeView masteryLevel={masteryLevel} currentMember={currentMember} currentUser={currentUser} homeId={currentHome?.id} onLevelUpdate={handleLevelUpdate} />;
    }
  };

  return (
    <>
      <div className="size-full flex flex-col bg-[#fafaf9]">
        {/* Top Header with Mastery Level Selector */}
        <div className="bg-white border-b border-border px-6 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="Logo" className="w-10 h-9" />
              <span className="text-sm">CleanQuest</span>
              {currentHome && (
                <>
                  <span className="text-muted-foreground text-sm">•</span>
                  <span className="text-sm text-muted-foreground">{currentHome.name}</span>
                </>
              )}
            </div>
            
            {/* Right side: Notifications + User Menu */}
            <div className="flex items-center gap-2">
              {/* Notifications Button */}
              <Button
                variant="ghost"
                size="sm"
                className="relative h-9 w-9 p-0"
                onClick={() => setNotificationsDialogOpen(true)}
              >
                {unreadCount() > 0 ? (
                  <BellDot className="w-5 h-5 text-red-500" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-[#6fbd9d] text-white text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  {/* <span className="text-sm font-medium">{userName}</span> */}
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
                    {(['novice', 'solver', 'expert', 'master', 'visionary'] as const).map((level) => (
                      <DropdownMenuItem 
                        key={level}
                        onClick={() => {
                          const { setMasteryLevel } = useMasteryStore.getState();
                          setMasteryLevel(level);
                        }}
                      >
                        <span className={masteryLevel === level ? "font-semibold" : ""}>
                          {level === 'novice' && 'Novato'}
                          {level === 'solver' && 'Solucionador'}
                          {level === 'expert' && 'Experto'}
                          {level === 'master' && 'Maestro'}
                          {level === 'visionary' && 'Visionario'}
                        </span>
                      </DropdownMenuItem>
                    ))}
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
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20 main-content-area">
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
          onOpenChange={(open) => {
            // Prevent closing dialog with external clicks
            if (!open && !isChangingHome) {
              // Only allow closing via cancel button
              return;
            }
            setShowChangeHomeDialog(open);
          }}
          currentHomeName={changeHomeData.currentHomeName}
          currentHomeOwner={changeHomeData.currentHomeOwner}
          newHomeName={changeHomeData.newHomeName}
          newHomeOwner={changeHomeData.newHomeOwner}
          onConfirm={handleConfirmChangeHome}
          onCancel={handleCancelChangeHome}
          isLoading={isChangingHome}
        />
      )}

      {/* Notifications Dialog */}
      <NotificationsDialog
        open={notificationsDialogOpen}
        onOpenChange={setNotificationsDialogOpen}
        notifications={notifications}
        currentMemberId={currentMember?.id}
        onSwapResponse={async () => {
          // Reload notifications and assignments after swap response
          if (currentMember?.id) {
            loadNotifications(currentUser?.email, currentMember.id);
          }
          // Trigger assignment reload in HomeView by changing the home state
          if (currentHome?.id) {
            loadHomeData(currentUser!.id);
          }
        }}
        onActionClick={(notification) => {
          if (notification.type === 'invitation') {
            const invNotification = notification as InvitationNotification;
            
            // Get current home owner
            const currentOwner = members.find(m => m.role === 'owner');
            const currentHomeOwner = currentOwner?.full_name || currentOwner?.email;
            
            // Usar el mismo flujo que las invitaciones por token
            setChangeHomeData({
              invitationId: invNotification.data.invitationId,
              token: invNotification.data.token,
              currentHomeName: currentHome?.name || null,
              currentHomeOwner,
              newHomeName: invNotification.data.homeName,
              newHomeOwner: invNotification.data.ownerName
            });
            setShowChangeHomeDialog(true);
            setNotificationsDialogOpen(false);
          }
          // Aquí se pueden agregar más handlers para otros tipos de notificaciones
        }}
      />

      <Toaster />
    </>
  );
}
