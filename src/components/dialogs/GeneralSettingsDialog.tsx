import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { 
  Bell, 
  Palette, 
  Settings as SettingsIcon, 
  Loader2,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useUnifiedSettingsStore } from "../../stores";
import type { HomeMember } from "../../lib/types";

interface GeneralSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMember: HomeMember | null;
  onUpdate?: () => void;
}

export function GeneralSettingsDialog({ 
  open, 
  onOpenChange, 
  currentMember, 
  onUpdate 
}: GeneralSettingsDialogProps) {
  const {
    reminderEnabled,
    reminderTime,
    reminderDays,
    theme,
    fontSize,
    taskNotifications,
    challengeNotifications,
    achievementNotifications,
    weeklyReport,
    isSavingPreferences,
    setReminderEnabled,
    setReminderTime,
    setReminderDays,
    setTheme,
    setFontSize,
    setTaskNotifications,
    setChallengeNotifications,
    setAchievementNotifications,
    setWeeklyReport,
    saveReminders,
    saveAppearance,
    saveNotifications,
    toggleReminderDay,
    resetUserPreferences,
    clearCache,
    exportData,
  } = useUnifiedSettingsStore();

  const handleSaveReminders = async () => {
    if (!currentMember) return;
    
    try {
      await saveReminders();
      onUpdate?.();
    } catch (error) {
      // Error already handled in store
    }
  };

  const handleSaveAppearance = async () => {
    try {
      await saveAppearance();
      onUpdate?.();
    } catch (error) {
      // Error already handled in store
    }
  };

  const handleSaveNotifications = async () => {
    if (!currentMember) return;
    
    try {
      await saveNotifications();
      onUpdate?.();
    } catch (error) {
      // Error already handled in store
    }
  };

  const handleExportData = () => {
    exportData();
  };

  const handleClearCache = () => {
    clearCache();
  };

  const handleResetSettings = () => {
    resetUserPreferences();
  };

  const toggleDay = (day: number) => {
    toggleReminderDay(day);
  };

  const getDayName = (day: number) => {
    const names = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    return names[day];
  };

  if (!currentMember) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Configuración General</DialogTitle>
          <DialogDescription>
            Personaliza tu experiencia en CleanQuest
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="reminders" className="w-full mt-4">
          <TabsList className="w-full !grid grid-cols-4 mb-6">
            <TabsTrigger value="reminders">
              <Bell className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <SettingsIcon className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          {/* REMINDERS TAB */}
          <TabsContent value="reminders">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Activar recordatorios</p>
                  <p className="text-xs text-muted-foreground">Recibe notificaciones diarias</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6fbd9d]"></div>
                </label>
              </div>

              {reminderEnabled && (
                <>
                  <div>
                    <Label htmlFor="reminder-time" className="text-sm">Hora del recordatorio</Label>
                    <input
                      id="reminder-time"
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Días de la semana</Label>
                    <div className="!flex flex-row gap-1 mt-2 flex-wrap">
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                        <button
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`w-12 h-5 rounded-full border-2 text-xs font-medium transition-colors ${
                            reminderDays.includes(day)
                              ? 'bg-[#6fbd9d] border-[#6fbd9d] text-white'
                              : 'border-gray-300 text-gray-600 hover:border-[#6fbd9d]'
                          }`}
                        >
                          {getDayName(day)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Button 
                onClick={handleSaveReminders} 
                disabled={isSavingPreferences}
                className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
              >
                {isSavingPreferences && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar recordatorios
              </Button>
            </div>
          </TabsContent>

          {/* APPEARANCE TAB */}
          <TabsContent value="appearance">
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Tema</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                      theme === "light"
                        ? 'border-[#6fbd9d] bg-[#e9f5f0]'
                        : 'border-gray-300 hover:border-[#6fbd9d]'
                    }`}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="text-xs">Claro</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                      theme === "dark"
                        ? 'border-[#6fbd9d] bg-[#e9f5f0]'
                        : 'border-gray-300 hover:border-[#6fbd9d]'
                    }`}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="text-xs">Oscuro</span>
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                      theme === "system"
                        ? 'border-[#6fbd9d] bg-[#e9f5f0]'
                        : 'border-gray-300 hover:border-[#6fbd9d]'
                    }`}
                  >
                    <Monitor className="w-5 h-5" />
                    <span className="text-xs">Sistema</span>
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="font-size" className="text-sm">Tamaño de fuente</Label>
                <Select value={fontSize} onValueChange={(v: string) => setFontSize(v as "small" | "medium" | "large")}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeña</SelectItem>
                    <SelectItem value="medium">Mediana</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSaveAppearance} 
                disabled={isSavingPreferences}
                className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
              >
                {isSavingPreferences && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Aplicar cambios
              </Button>
            </div>
          </TabsContent>

          {/* NOTIFICATIONS TAB */}
          <TabsContent value="notifications">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Tareas</p>
                  <p className="text-xs text-muted-foreground">Asignadas y vencimientos</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskNotifications}
                    onChange={(e) => setTaskNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6fbd9d]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Desafíos</p>
                  <p className="text-xs text-muted-foreground">Nuevos y resultados</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={challengeNotifications}
                    onChange={(e) => setChallengeNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6fbd9d]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Insignias</p>
                  <p className="text-xs text-muted-foreground">Desbloqueadas</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={achievementNotifications}
                    onChange={(e) => setAchievementNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6fbd9d]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Resumen semanal</p>
                  <p className="text-xs text-muted-foreground">Email cada lunes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weeklyReport}
                    onChange={(e) => setWeeklyReport(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6fbd9d]"></div>
                </label>
              </div>

              <Button 
                onClick={handleSaveNotifications} 
                disabled={isSavingPreferences}
                className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
              >
                {isSavingPreferences && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar preferencias
              </Button>
            </div>
          </TabsContent>

          {/* ADVANCED TAB */}
          <TabsContent value="advanced">
            <div className="space-y-3">
              <Button 
                onClick={handleExportData}
                variant="outline" 
                size="sm"
                className="w-full justify-start"
              >
                Exportar mis datos
              </Button>

              <Button 
                onClick={handleClearCache}
                variant="outline" 
                size="sm"
                className="w-full justify-start"
              >
                Limpiar caché local
              </Button>

              <Button 
                onClick={handleResetSettings}
                variant="outline" 
                size="sm"
                className="w-full justify-start text-amber-600 hover:text-amber-700"
              >
                Restablecer configuración
              </Button>

              <div className="p-3 bg-muted/30 rounded-lg mt-4">
                <p className="text-xs text-muted-foreground mb-1">
                  <strong>Versión:</strong> 1.0.0
                </p>
                <p className="text-xs text-muted-foreground mb-1">
                  <strong>Usuario:</strong> {currentMember.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Nivel:</strong> {currentMember.mastery_level}
                </p>
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
