import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { User, Shield, Settings, Loader2, EyeOff, Eye, Home, AlertTriangle, Bell, Crown } from "lucide-react";
import { useMembersStore, useInvitationStore, useAuthStore } from "../../stores";
import { db } from "../../lib/db";
import { toast } from "sonner";
import type { HomeMember, Home as HomeType } from "../../lib/types";

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMember: HomeMember | null;
  currentHome: HomeType | null;
  onUpdate?: () => void;
}

export function ProfileSettingsDialog({ 
  open, 
  onOpenChange, 
  currentMember,
  currentHome,
  onUpdate 
}: ProfileSettingsDialogProps) {
  const {
    profileName,
    profileEmail,
    showPassword,
    currentPassword,
    newPassword,
    confirmPassword,
    emailNotifications,
    pushNotifications,
    weeklyReports,
    isSavingProfile,
    isChangingPassword,
    isSavingPreferences,
    members,
    setProfileName,
    setProfileEmail,
    setShowPassword,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    setEmailNotifications,
    setPushNotifications,
    setWeeklyReports,
    initializeProfile,
    updateProfile,
    changePassword,
    updatePreferences,
    loadMembers,
  } = useMembersStore();

  // Invitation store for change home functionality
  const {
    changeHomeData,
    isProcessing: isProcessingInvite,
    processInvitation,
    acceptHomeChange,
    declineHomeChange,
  } = useInvitationStore();

  // Auth store for updating user profile globally
  const { updateUserProfile } = useAuthStore();

  useEffect(() => {
    if (currentMember) {
      initializeProfile(currentMember);
    }
  }, [currentMember, initializeProfile]);

  // Load members when dialog opens and currentHome is available
  useEffect(() => {
    if (open && currentHome) {
      loadMembers(currentHome.id);
    }
  }, [open, currentHome, loadMembers]);

  const handleUpdateProfile = async () => {
    if (!currentMember || !currentHome) return;
    
    try {
      await updateProfile(currentMember.id);
      
      // Update authStore to reflect changes globally (fixes the need for F5)
      await updateUserProfile({ full_name: profileName });
      
      // Reload currentMember to reflect changes from profiles table
      const user = await db.getCurrentUser();
      if (user) {
        const updatedMember = await db.getCurrentMember(currentHome.id, user.id);
        if (updatedMember) {
          const { setCurrentMember } = useMembersStore.getState();
          setCurrentMember(updatedMember);
        }
      }
      
      onUpdate?.();
    } catch (error) {
      // Error already handled in store
    }
  };

  const handleChangePassword = async () => {
    if (!currentMember) return;
    
    try {
      await changePassword(currentMember.id);
    } catch (error) {
      // Error already handled in store
    }
  };

  const handleUpdatePreferences = async () => {
    if (!currentMember) return;
    
    try {
      await updatePreferences();
      onUpdate?.();
    } catch (error) {
      // Error already handled in store
    }
  };

  const handleProcessInvitation = async (token: string) => {
    const user = await db.getCurrentUser();
    if (!user) {
      toast.error("Usuario no autenticado");
      return;
    }
    await processInvitation(token, user.id);
  };

  const handleAcceptHomeChange = async () => {
    const user = await db.getCurrentUser();
    if (!user) {
      toast.error("Usuario no autenticado");
      return;
    }
    await acceptHomeChange(user.id);
    onUpdate?.();
  };

  const handleDeclineHomeChange = async () => {
    await declineHomeChange(currentHome?.name || null);
  };

  if (!currentMember) return null;

  const initials = currentMember.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || "U";

  // Get owner name for current home
  const ownerMember = members.find(m => m.role === 'owner');
  const ownerName = ownerMember?.full_name || ownerMember?.email || 'Desconocido';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Mi Perfil</DialogTitle>
          <DialogDescription>
            Gestiona tu información personal, seguridad y preferencias
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="w-full !grid grid-cols-4 mb-6">
            <TabsTrigger value="personal">
              <User className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Bell className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="home">
              <Home className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal">
            <div className="space-y-4">
              <div className="flex flex-col items-center mb-4">
                <Avatar className="w-10 h-10 mb-2">
                  <AvatarFallback className="bg-[#6fbd9d] text-white text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              
              </div>

              <div>
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileEmail}
                  readOnly
                  disabled
                  placeholder="tu@email.com"
                  className="bg-muted/30"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  El correo no se puede modificar
                </p>
              </div>

              <Button 
                onClick={handleUpdateProfile}
                disabled={isSavingProfile}
                className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
              >
                {isSavingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar cambios
              </Button>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-1">Cambiar contraseña</h4>
                <p className="text-xs text-muted-foreground">
                  La contraseña debe tener al menos 8 caracteres
                </p>
              </div>

              <div>
                <Label htmlFor="current-password">Contraseña actual</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button 
                onClick={handleChangePassword}
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
              >
                {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Cambiar contraseña
              </Button>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <div className="space-y-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-1">Notificaciones</h4>
                <p className="text-xs text-muted-foreground">
                  Controla cómo y cuándo quieres recibir notificaciones
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Notificaciones por correo</p>
                  <p className="text-xs text-muted-foreground">Recibe actualizaciones por email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6fbd9d]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Notificaciones push</p>
                  <p className="text-xs text-muted-foreground">Alertas en tiempo real</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6fbd9d]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Resumen semanal</p>
                  <p className="text-xs text-muted-foreground">Estadísticas cada lunes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weeklyReports}
                    onChange={(e) => setWeeklyReports(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6fbd9d]"></div>
                </label>
              </div>

              <Button 
                onClick={handleUpdatePreferences}
                disabled={isSavingPreferences}
                className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
              >
                {isSavingPreferences && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar preferencias
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="home" className="space-y-4 mt-6">
            <Card className="p-4 bg-[#e8dff0]">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-[#9b7cb8]" />
                <p className="text-xs text-[#9b7cb8]">Casa actual</p>
              </div>
              <p className="font-semibold">
                {currentHome?.name || "No estás en ninguna casa"}
              </p>
              {currentHome && ownerMember && (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#9b7cb8]/20">
                  <Crown className="h-3 w-3 text-yellow-600" />
                  <p className="text-xs text-muted-foreground">{ownerName}</p>
                </div>
              )}
            </Card>

            {changeHomeData && (
              <Card className="p-4 bg-yellow-500/10 border-yellow-500/50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2 text-sm">Invitación pendiente</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Has sido invitado a unirte a <strong>{changeHomeData.newHomeName}</strong>
                      {changeHomeData.currentHomeName && (
                        <> en lugar de <strong>{changeHomeData.currentHomeName}</strong></>
                      )}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleAcceptHomeChange}
                        disabled={isProcessingInvite}
                        className="bg-[#6fbd9d] hover:bg-[#5fa989]"
                      >
                        {isProcessingInvite && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        Aceptar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDeclineHomeChange}
                        disabled={isProcessingInvite}
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Cambiar de hogar</h4>
              <p className="text-xs text-muted-foreground">
                Ingresa el token de invitación que te compartió un miembro
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Token de invitación"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      if (input.value.trim()) {
                        handleProcessInvitation(input.value.trim());
                        input.value = '';
                      }
                    }
                  }}
                />
                <Button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input?.value.trim()) {
                      handleProcessInvitation(input.value.trim());
                      input.value = '';
                    }
                  }}
                  disabled={isProcessingInvite}
                  className="bg-[#6fbd9d] hover:bg-[#5fa989]"
                >
                  {isProcessingInvite && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Procesar
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full mt-4"
        >
          Cerrar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
