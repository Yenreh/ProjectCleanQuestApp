import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from '../lib/db';
import type { Home } from '../lib/types';
import { toast } from 'sonner';

type RotationPolicy = 'daily' | 'weekly' | 'biweekly' | 'monthly';
type Theme = "light" | "dark" | "system";
type FontSize = "small" | "medium" | "large";

interface UnifiedSettingsState {
  // ═══════════════════════════════════════
  // HOME CONFIGURATION (from settingsStore + homeManagementStore)
  // ═══════════════════════════════════════
  goalPercentage: string;
  rotationPolicy: RotationPolicy;
  autoRotation: boolean;
  
  // ═══════════════════════════════════════
  // USER PREFERENCES (from generalSettingsStore)
  // ═══════════════════════════════════════
  // Reminder settings
  reminderEnabled: boolean;
  reminderTime: string;
  reminderDays: number[];
  
  // Appearance settings
  theme: Theme;
  fontSize: FontSize;
  
  // Notification preferences
  taskNotifications: boolean;
  challengeNotifications: boolean;
  achievementNotifications: boolean;
  weeklyReport: boolean;
  
  // ═══════════════════════════════════════
  // DIALOG STATES - Moved to uiStore
  // ═══════════════════════════════════════
  // statisticsOpen, nextCycleOpen → use useUIStore
  
  // ═══════════════════════════════════════
  // LOADING STATES
  // ═══════════════════════════════════════
  isUpdatingGoal: boolean;
  isUpdatingRotation: boolean;
  isRotatingCycle: boolean;
  isSavingPreferences: boolean;
  
  // ═══════════════════════════════════════
  // HOME CONFIGURATION ACTIONS
  // ═══════════════════════════════════════
  setGoalPercentage: (goal: string) => void;
  setRotationPolicy: (policy: RotationPolicy) => void;
  setAutoRotation: (auto: boolean) => void;
  
  loadHomeSettings: (home: Home | null) => void;
  updateGoal: (homeId: number, newGoal: string) => Promise<void>;
  updateRotationPolicy: (homeId: number, newPolicy: RotationPolicy) => Promise<void>;
  updateAutoRotation: (homeId: number, enabled: boolean) => Promise<void>;
  closeCycleAndReassign: (homeId: number) => Promise<void>;
  reassignPendingTasks: (homeId: number) => Promise<void>;
  
  // ═══════════════════════════════════════
  // USER PREFERENCES ACTIONS
  // ═══════════════════════════════════════
  setReminderEnabled: (enabled: boolean) => void;
  setReminderTime: (time: string) => void;
  setReminderDays: (days: number[]) => void;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setTaskNotifications: (enabled: boolean) => void;
  setChallengeNotifications: (enabled: boolean) => void;
  setAchievementNotifications: (enabled: boolean) => void;
  setWeeklyReport: (enabled: boolean) => void;
  
  toggleReminderDay: (day: number) => void;
  saveReminders: () => Promise<void>;
  saveAppearance: () => Promise<void>;
  saveNotifications: () => Promise<void>;
  
  // ═══════════════════════════════════════
  // UTILITY ACTIONS
  // ═══════════════════════════════════════
  // setStatisticsOpen, setNextCycleOpen → use useUIStore
  resetUserPreferences: () => void;
  exportData: () => void;
}

export const useUnifiedSettingsStore = create<UnifiedSettingsState>()(
  devtools(
    (set, get) => ({
      // ═══════════════════════════════════════
      // INITIAL STATE
      // ═══════════════════════════════════════
      // Home configuration
      goalPercentage: "80",
      rotationPolicy: 'weekly',
      autoRotation: true,
      
      // User preferences - Reminders
      reminderEnabled: true,
      reminderTime: "09:00",
      reminderDays: [1, 2, 3, 4, 5],
      
      // User preferences - Appearance
      theme: "system",
      fontSize: "medium",
      
      // User preferences - Notifications
      taskNotifications: true,
      challengeNotifications: true,
      achievementNotifications: true,
      weeklyReport: true,
      
      // Dialog states - Moved to uiStore
      
      // Loading states
      isUpdatingGoal: false,
      isUpdatingRotation: false,
      isRotatingCycle: false,
      isSavingPreferences: false,
      
      // ═══════════════════════════════════════
      // HOME CONFIGURATION ACTIONS
      // ═══════════════════════════════════════
      setGoalPercentage: (goal) => set({ goalPercentage: goal }),
      
      setRotationPolicy: (policy) => set({ rotationPolicy: policy }),
      
      setAutoRotation: (auto) => set({ autoRotation: auto }),
      
      loadHomeSettings: (home) => {
        if (home) {
          set({
            goalPercentage: home.goal_percentage?.toString() || "80",
            rotationPolicy: (home.rotation_policy as RotationPolicy) || 'weekly',
            autoRotation: home.auto_rotation ?? true
          });
        }
      },
      
      updateGoal: async (homeId: number, newGoal: string) => {
        const prevGoal = get().goalPercentage;
        
        set({ isUpdatingGoal: true, goalPercentage: newGoal });
        
        try {
          const goalNum = parseInt(newGoal);
          if (isNaN(goalNum) || goalNum < 1 || goalNum > 100) {
            throw new Error('Meta debe estar entre 1 y 100');
          }
          
          await db.updateHome(homeId, { goal_percentage: goalNum });
          toast.success('Meta actualizada correctamente');
        } catch (error: any) {
          console.error('Error updating goal:', error);
          toast.error(error.message || 'Error al actualizar meta');
          set({ goalPercentage: prevGoal });
        } finally {
          set({ isUpdatingGoal: false });
        }
      },
      
      updateRotationPolicy: async (homeId: number, newPolicy: RotationPolicy) => {
        const prevPolicy = get().rotationPolicy;
        
        set({ isUpdatingRotation: true, rotationPolicy: newPolicy });
        
        try {
          await db.updateHome(homeId, { rotation_policy: newPolicy });
          toast.success('Política de rotación actualizada');
        } catch (error: any) {
          console.error('Error updating rotation policy:', error);
          toast.error('Error al actualizar política');
          set({ rotationPolicy: prevPolicy });
        } finally {
          set({ isUpdatingRotation: false });
        }
      },
      
      updateAutoRotation: async (homeId: number, enabled: boolean) => {
        const prevAutoRotation = get().autoRotation;
        
        set({ autoRotation: enabled });
        
        try {
          await db.updateHome(homeId, { auto_rotation: enabled });
          toast.success(`Rotación automática ${enabled ? 'activada' : 'desactivada'}`);
        } catch (error: any) {
          console.error('Error updating auto rotation:', error);
          toast.error('Error al actualizar rotación automática');
          set({ autoRotation: prevAutoRotation });
        }
      },
      
      closeCycleAndReassign: async (homeId: number) => {
        set({ isRotatingCycle: true });
        
        try {
          const result = await db.closeCycleAndReassign(homeId);
          toast.success(`Ciclo cerrado: ${result.closed} tareas pendientes. ${result.assigned} tareas reasignadas.`);
        } catch (error: any) {
          console.error('Error rotating cycle:', error);
          toast.error('Error al rotar el ciclo');
          throw error;
        } finally {
          set({ isRotatingCycle: false });
        }
      },
      
      reassignPendingTasks: async (homeId: number) => {
        set({ isRotatingCycle: true });
        
        try {
          const result = await db.reassignPendingTasks(homeId);
          if (result.reassigned === 0) {
            toast.info('No hay tareas pendientes para redistribuir');
          } else {
            toast.success(`${result.reassigned} tareas pendientes redistribuidas equitativamente`);
          }
        } catch (error: any) {
          console.error('Error reassigning tasks:', error);
          toast.error('Error al redistribuir las tareas');
          throw error;
        } finally {
          set({ isRotatingCycle: false });
        }
      },
      
      // ═══════════════════════════════════════
      // USER PREFERENCES ACTIONS
      // ═══════════════════════════════════════
      setReminderEnabled: (enabled) => set({ reminderEnabled: enabled }),
      
      setReminderTime: (time) => set({ reminderTime: time }),
      
      setReminderDays: (days) => set({ reminderDays: days }),
      
      setTheme: (theme) => set({ theme }),
      
      setFontSize: (size) => set({ fontSize: size }),
      
      setTaskNotifications: (enabled) => set({ taskNotifications: enabled }),
      
      setChallengeNotifications: (enabled) => set({ challengeNotifications: enabled }),
      
      setAchievementNotifications: (enabled) => set({ achievementNotifications: enabled }),
      
      setWeeklyReport: (enabled) => set({ weeklyReport: enabled }),
      
      toggleReminderDay: (day: number) => {
        const { reminderDays } = get();
        const newDays = reminderDays.includes(day)
          ? reminderDays.filter((d) => d !== day)
          : [...reminderDays, day].sort();
        set({ reminderDays: newDays });
      },
      
      saveReminders: async () => {
        set({ isSavingPreferences: true });
        try {
          // TODO: Implement actual save logic when backend is ready
          toast.info("Función en desarrollo");
        } catch (error) {
          console.error('Error saving reminders:', error);
          toast.error("Error al guardar recordatorios");
        } finally {
          set({ isSavingPreferences: false });
        }
      },
      
      saveAppearance: async () => {
        set({ isSavingPreferences: true });
        try {
          // TODO: Implement actual save logic when backend is ready
          toast.info("Función en desarrollo");
        } catch (error) {
          console.error('Error saving appearance:', error);
          toast.error("Error al guardar apariencia");
        } finally {
          set({ isSavingPreferences: false });
        }
      },
      
      saveNotifications: async () => {
        set({ isSavingPreferences: true });
        try {
          // TODO: Implement actual save logic when backend is ready
          toast.info("Función en desarrollo");
        } catch (error) {
          console.error('Error saving notifications:', error);
          toast.error("Error al guardar notificaciones");
        } finally {
          set({ isSavingPreferences: false });
        }
      },
      
      // ═══════════════════════════════════════
      // UTILITY ACTIONS
      // ═══════════════════════════════════════
      // setStatisticsOpen, setNextCycleOpen → use useUIStore
      
      resetUserPreferences: () => {
        if (confirm('¿Restablecer toda la configuración de usuario?')) {
          set({
            reminderEnabled: true,
            reminderTime: "09:00",
            reminderDays: [1, 2, 3, 4, 5],
            theme: "system",
            fontSize: "medium",
            taskNotifications: true,
            challengeNotifications: true,
            achievementNotifications: true,
            weeklyReport: true,
          });
          toast.success("Configuración de usuario restablecida");
        }
      },
      
      exportData: () => {
        toast.info("Función en desarrollo: exportar datos");
      }
    }),
    { name: 'UnifiedSettingsStore' }
  )
);
