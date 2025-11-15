import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { User, Lock, Settings, Upload, X, Shield, Loader2, EyeOff, Eye } from "lucide-react";
import { db } from "../../lib/db";
import { toast } from "sonner";
import type { HomeMember } from "../../lib/types";

interface ProfileSettingsProps {
  currentMember: HomeMember | null;
  onUpdate?: () => void;
}

export function ProfileSettingsView({ currentMember, onUpdate }: ProfileSettingsProps) {
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
    
    setIsLoading(true);
    try {
      await db.updateMemberProfile(currentMember.id, name, email);
      toast.success("Perfil actualizado correctamente");
      onUpdate?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Error al actualizar perfil");
    } finally {
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

  if (!currentMember) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No hay usuario conectado</p>
      </div>
    );
  }

  const initials = currentMember.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || "U";

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="mb-2">Configuración de perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal, seguridad y preferencias
        </p>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-6">
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
          <Card className="p-6">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="w-24 h-24 mb-3">
                <AvatarFallback className="bg-[#6fbd9d] text-white text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">Función de avatar en desarrollo</p>
            </div>

            <div className="space-y-4">
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleUpdateProfile}
                  disabled={isLoading}
                  className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Guardar cambios
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="mb-2">Cambiar contraseña</h3>
              <p className="text-sm text-muted-foreground">
                La contraseña debe tener al menos 8 caracteres
              </p>
            </div>

            <div className="space-y-4">
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

              <div className="pt-4">
                <Button 
                  onClick={handleChangePassword}
                  disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Cambiar contraseña
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="mb-2">Notificaciones</h3>
              <p className="text-sm text-muted-foreground">
                Controla cómo y cuándo quieres recibir notificaciones
              </p>
            </div>

            <div className="space-y-4">
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

              <div className="pt-4">
                <Button 
                  onClick={handleUpdatePreferences}
                  disabled={isLoading}
                  className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Guardar preferencias
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
