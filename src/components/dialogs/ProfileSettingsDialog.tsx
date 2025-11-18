import { useState, useEffect, useCallback } from "react";
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
import { User, Shield, Settings, Loader2, EyeOff, Eye, Home, AlertTriangle, Bell } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Personal info state
  const [name, setName] = useState(currentMember?.full_name || "");
  const [email, setEmail] = useState(currentMember?.email || "");
  
  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);

  // Change home state
  const [inviteToken, setInviteToken] = useState("");
  const [showChangeHomeConfirm, setShowChangeHomeConfirm] = useState(false);

  useEffect(() => {
    if (currentMember) {
      setName(currentMember.full_name || "");
      setEmail(currentMember.email || "");
    }
  }, [currentMember]);

  const handleUpdateProfile = async () => {
    if (!currentMember) return;
    
    if (!name.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    
    // Store for rollback
    const prevName = name;
    const prevEmail = email;
    
    setIsLoading(true);
    try {
      // Persist to database
      await db.updateMemberProfile(currentMember.id, name.trim(), email.trim());
      toast.success("Perfil actualizado correctamente");
      
      // Notify parent to refresh
      onUpdate?.();
      
      // Give a moment for the update to propagate
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Error al actualizar perfil");
      
      // Rollback on error
      setName(prevName);
      setEmail(prevEmail);
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentMember) return;
    
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    
    setIsLoading(true);
    try {
      await db.changePassword(currentPassword, newPassword);
      toast.success("Contraseña cambiada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error("Error al cambiar contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePreferences = async () => {
    if (!currentMember) return;
    
    setIsLoading(true);
    try {
      await db.updateMemberPreferences(currentMember.id, {
        emailNotifications,
        pushNotifications,
        weeklyReports
      });
      toast.success("Preferencias actualizadas correctamente");
      onUpdate?.();
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error("Error al actualizar preferencias");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeHome = async () => {
    if (!inviteToken.trim()) {
      toast.error("Ingresa un token de invitación válido");
      return;
    }

    const user = await db.getCurrentUser();
    if (!user) {
      toast.error("Usuario no encontrado");
      return;
    }

    setIsLoading(true);
    try {
      await db.changeHome(user.id, inviteToken.trim());
      toast.success("¡Te has cambiado de casa exitosamente!");
      setInviteToken("");
      setShowChangeHomeConfirm(false);
      onOpenChange(false);
      
      // Reload page to update all data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error changing home:', error);
      toast.error(error.message || "Error al cambiar de casa");
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentMember) return null;

  const initials = currentMember.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || "U";

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
                <Avatar className="w-20 h-20 mb-2">
                  <AvatarFallback className="bg-[#6fbd9d] text-white text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              
              </div>

              <div>
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
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
                disabled={isLoading}
                className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                disabled={isLoading}
                className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar preferencias
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="home" className="space-y-4 mt-6">
            <Card className="p-4 bg-muted/30">
              <h3 className="font-semibold mb-2">Casa actual</h3>
              <p className="text-sm text-muted-foreground">
                {currentHome?.name || "No estás en ninguna casa"}
              </p>
            </Card>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Token de invitación</Label>
                <Input
                  type="text"
                  placeholder="Pega el token de invitación aquí"
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa el token de invitación a una nueva casa
                </p>
              </div>

              <Card className="p-4 border-yellow-500/50 bg-yellow-500/10">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Advertencia</h4>
                    <p className="text-xs text-muted-foreground">
                      Al cambiar de casa, tu membresía actual se desactivará. 
                      Perderás acceso a las tareas, estadísticas y configuración de tu casa actual.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="confirmChange"
                  checked={showChangeHomeConfirm}
                  onChange={(e) => setShowChangeHomeConfirm(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="confirmChange"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Entiendo las consecuencias y quiero cambiar de casa
                </label>
              </div>

              <Button 
                onClick={handleChangeHome}
                disabled={isLoading || !showChangeHomeConfirm || !inviteToken.trim()}
                className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Cambiar de casa
              </Button>
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
