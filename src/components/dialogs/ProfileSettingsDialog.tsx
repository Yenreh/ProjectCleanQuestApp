import { useState, useEffect } from "react";
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
import { User, Shield, Settings, Loader2, EyeOff, Eye } from "lucide-react";
import { db } from "../../lib/db";
import { toast } from "sonner";
import type { HomeMember } from "../../lib/types";

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMember: HomeMember | null;
  onUpdate?: () => void;
}

export function ProfileSettingsDialog({ 
  open, 
  onOpenChange, 
  currentMember, 
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
    
    setIsLoading(true);
    try {
      await db.updateMemberProfile(currentMember.id, name.trim(), email.trim());
      toast.success("Perfil actualizado correctamente");
      onUpdate?.();
      // Give a moment for the update to propagate
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Error al actualizar perfil");
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

        <Tabs defaultValue="personal" className="w-full mt-4">
          <TabsList className="w-full !grid grid-cols-3 mb-6">
            <TabsTrigger value="personal">
              <User className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Settings className="w-4 h-4" />
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
                <p className="text-xs text-muted-foreground">Función de avatar en desarrollo</p>
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
