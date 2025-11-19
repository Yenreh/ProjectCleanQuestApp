import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from '../lib/db';
import { toast } from 'sonner';
import type { 
  Task, 
  Zone, 
  HomeMember, 
  MemberRole, 
  CreateTaskInput, 
  CreateZoneInput,
  CreateTaskStepInput
} from '../lib/types';

interface HomeManagementState {
  // Data lists
  tasks: Task[];
  zones: Zone[];
  // members: Moved to membersStore (Phase 2)
  // activeInvitations: Moved to invitationStore (Phase 2)
  
  // Loading states
  isLoading: boolean;
  // loadingInvitations: Moved to invitationStore (Phase 2)
  
  // Task form state
  // showTaskForm, showSteps moved to uiStore (UI booleans)
  editingTask: Task | null;
  taskName: string;
  taskDescription: string;
  taskZone: string;
  taskEffort: string;
  taskFrequency: string;
  taskSteps: Array<{ title: string; description: string; is_optional: boolean; estimated_minutes: number }>;
  
  // Zone form state
  // showZoneForm moved to uiStore (UI boolean)
  editingZone: Zone | null;
  zoneName: string;
  
  // Member form state - REMOVED (Phase 4)
  // All member management moved to membersStore (Phase 2)
  // All invitation management moved to invitationStore (Phase 2)
  // showInviteForm moved to invitationStore, then to uiStore (Phase 4)
  // showRemoveConfirm moved to uiStore (Phase 2)
  
  // Home config state
  homeName: string;
  groupGoal: number;
  rotationPolicy: string;
  rotationEnabled: boolean;
  
  // Actions - Data loading
  loadHomeData: (homeId: number) => Promise<void>;
  // loadInvitations: Moved to invitationStore (Phase 2)
  
  // Actions - Task management
  // setShowTaskForm, setShowSteps moved to uiStore
  setEditingTask: (task: Task | null) => void;
  setTaskName: (name: string) => void;
  setTaskDescription: (description: string) => void;
  setTaskZone: (zone: string) => void;
  setTaskEffort: (effort: string) => void;
  setTaskFrequency: (frequency: string) => void;
  setTaskSteps: (steps: Array<{ title: string; description: string; is_optional: boolean; estimated_minutes: number }>) => void;
  resetTaskForm: () => void;
  startEditTask: (task: Task) => void;
  saveTask: (homeId: number, onSuccess: () => void) => Promise<void>;
  deleteTask: (taskId: number, onSuccess: () => void) => Promise<void>;
  
  // Actions - Zone management
  // setShowZoneForm moved to uiStore
  setEditingZone: (zone: Zone | null) => void;
  setZoneName: (name: string) => void;
  resetZoneForm: () => void;
  startEditZone: (zone: Zone) => void;
  saveZone: (homeId: number, onSuccess: () => void) => Promise<void>;
  deleteZone: (zoneId: number, onSuccess: () => void) => Promise<void>;
  
  // Actions - Member management - REMOVED (Phase 4)
  // All member actions moved to membersStore (Phase 2)
  // All invitation actions moved to invitationStore (Phase 2)
  
  // Actions - Home config
  setHomeName: (name: string) => void;
  setGroupGoal: (goal: number) => void;
  setRotationPolicy: (policy: string) => void;
  setRotationEnabled: (enabled: boolean) => void;
  initializeHomeConfig: (name: string, goal: number, policy: string, enabled: boolean) => void;
  saveHomeConfig: (homeId: number, onSuccess: () => void) => Promise<void>;
}

export const useHomeManagementStore = create<HomeManagementState>()(
  devtools(
    (set, get) => ({
      // Initial state
      tasks: [],
      zones: [],
      // members: Removed (use membersStore)
      // activeInvitations: Removed (use invitationStore)
      isLoading: false,
      // loadingInvitations: Removed (use invitationStore)
      
      // Task form initial state
      // showTaskForm, showSteps moved to uiStore
      editingTask: null,
      taskName: "",
      taskDescription: "",
      taskZone: "none",
      taskEffort: "medium",
      taskFrequency: "weekly",
      taskSteps: [],
      
      // Zone form initial state
      // showZoneForm moved to uiStore
      editingZone: null,
      zoneName: "",
      
      // Member form initial state - REMOVED (Phase 4)
      // All member/invitation state removed - use membersStore/invitationStore
      
      // Home config initial state
      homeName: "",
      groupGoal: 80,
      rotationPolicy: "weekly",
      rotationEnabled: false,
      
      // Data loading actions
      loadHomeData: async (homeId: number) => {
        set({ isLoading: true });
        try {
          // Only load tasks and zones - members handled by membersStore
          const [tasksData, zonesData] = await Promise.all([
            db.getTasks(homeId),
            db.getZones(homeId)
          ]);
          set({ tasks: tasksData, zones: zonesData });
        } catch (error) {
          console.error('Error loading home data:', error);
          toast.error("Error al cargar los datos");
        } finally {
          set({ isLoading: false });
        }
      },
      
      // loadInvitations: REMOVED - Use invitationStore.loadInvitations() instead (Phase 4)
      
      // Task management actions
      // setShowTaskForm, setShowSteps moved to uiStore
      setEditingTask: (task) => set({ editingTask: task }),
      setTaskName: (name) => set({ taskName: name }),
      setTaskDescription: (description) => set({ taskDescription: description }),
      setTaskZone: (zone) => set({ taskZone: zone }),
      setTaskEffort: (effort) => set({ taskEffort: effort }),
      setTaskFrequency: (frequency) => set({ taskFrequency: frequency }),
      setTaskSteps: (steps) => set({ taskSteps: steps }),
      
      resetTaskForm: () => {
        set({
          editingTask: null,
          taskName: "",
          taskDescription: "",
          taskZone: "none",
          taskEffort: "medium",
          taskFrequency: "weekly",
          taskSteps: [],
        });
        // showTaskForm closing moved to uiStore - component should call useUIStore().setShowTaskForm(false)
      },
      
      startEditTask: (task: Task) => {
        const effortToLevel = (points: number) => {
          if (points <= 1) return "very_low";
          if (points <= 3) return "low";
          if (points <= 5) return "medium";
          if (points <= 7) return "high";
          return "very_high";
        };
        
        set({
          editingTask: task,
          taskName: task.title,
          taskDescription: task.description || "",
          taskZone: task.zone_id?.toString() || "none",
          taskEffort: effortToLevel(task.effort_points),
          taskFrequency: task.frequency || "weekly",
        });
        // showTaskForm opening moved to uiStore - component should call useUIStore().setShowTaskForm(true)
        
        // Load steps if any
        db.getTaskSteps(task.id).then(steps => {
          set({ 
            taskSteps: steps.map(s => ({
              title: s.title,
              description: s.description || "",
              is_optional: s.is_optional,
              estimated_minutes: s.estimated_minutes || 0
            }))
          });
          // showSteps opening moved to uiStore - component should call useUIStore().setShowSteps(steps.length > 0)
        }).catch(err => {
          console.error('Error loading task steps:', err);
        });
      },
      
      saveTask: async (homeId: number, onSuccess: () => void) => {
        const { editingTask, taskName, taskDescription, taskZone, taskEffort, taskFrequency, taskSteps } = get();
        
        if (!taskName.trim()) {
          toast.error("El nombre de la tarea es requerido");
          return;
        }

        set({ isLoading: true });
        try {
          const effortPoints = 
            taskEffort === "very_low" ? 1 : 
            taskEffort === "low" ? 3 : 
            taskEffort === "medium" ? 5 : 
            taskEffort === "high" ? 7 : 
            taskEffort === "very_high" ? 10 : 5;
          
          const taskData: CreateTaskInput = {
            title: taskName.trim(),
            description: taskDescription.trim() || undefined,
            zone_id: taskZone !== "none" ? parseInt(taskZone) : undefined,
            effort_points: effortPoints,
            frequency: taskFrequency as any,
            icon: "clipboard",
            is_active: true,
            is_template: false
          };

          let savedTask: Task;
          if (editingTask) {
            savedTask = await db.updateTask(editingTask.id, taskData);
            toast.success("Tarea actualizada");
          } else {
            savedTask = await db.createTask(homeId, taskData);
            toast.success("Tarea creada");
          }

          // Save steps if any
          if (taskSteps.length > 0) {
            await db.deleteTaskSteps(savedTask.id);
            await Promise.all(
              taskSteps.map((step, i) =>
                db.createTaskStep(savedTask.id, {
                  step_order: i + 1,
                  title: step.title,
                  description: step.description || undefined,
                  is_optional: step.is_optional,
                  estimated_minutes: step.estimated_minutes || undefined
                })
              )
            );
          }

          get().resetTaskForm();
          await get().loadHomeData(homeId);
          onSuccess();
        } catch (error) {
          console.error('Error saving task:', error);
          toast.error("Error al guardar la tarea");
        } finally {
          set({ isLoading: false });
        }
      },
      
      deleteTask: async (taskId: number, onSuccess: () => void) => {
        if (!confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) {
          return;
        }

        set({ isLoading: true });
        try {
          await db.deleteTask(taskId);
          toast.success("Tarea eliminada");
          
          const { tasks } = get();
          set({ tasks: tasks.filter(t => t.id !== taskId) });
          onSuccess();
        } catch (error) {
          console.error('Error deleting task:', error);
          toast.error("Error al eliminar la tarea");
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Zone management actions
      // setShowZoneForm moved to uiStore
      setEditingZone: (zone) => set({ editingZone: zone }),
      setZoneName: (name) => set({ zoneName: name }),
      
      resetZoneForm: () => {
        set({
          editingZone: null,
          zoneName: "",
        });
        // showZoneForm closing moved to uiStore - component should call useUIStore().setShowZoneForm(false)
      },
      
      startEditZone: (zone: Zone) => {
        set({
          editingZone: zone,
          zoneName: zone.name,
        });
        // showZoneForm opening moved to uiStore - component should call useUIStore().setShowZoneForm(true)
      },
      
      saveZone: async (homeId: number, onSuccess: () => void) => {
        const { editingZone, zoneName } = get();
        
        if (!zoneName.trim()) {
          toast.error("El nombre de la zona es requerido");
          return;
        }

        set({ isLoading: true });
        try {
          const zoneData: CreateZoneInput = {
            name: zoneName.trim(),
            icon: "map-pin"
          };

          if (editingZone) {
            await db.updateZone(editingZone.id, zoneData);
            toast.success("Zona actualizada");
          } else {
            await db.createZone(homeId, zoneData);
            toast.success("Zona creada");
          }

          get().resetZoneForm();
          await get().loadHomeData(homeId);
          onSuccess();
        } catch (error) {
          console.error('Error saving zone:', error);
          toast.error("Error al guardar la zona");
        } finally {
          set({ isLoading: false });
        }
      },
      
      deleteZone: async (zoneId: number, onSuccess: () => void) => {
        if (!confirm('¿Eliminar esta zona? Las tareas asociadas no se eliminarán.')) {
          return;
        }

        set({ isLoading: true });
        try {
          await db.deleteZone(zoneId);
          toast.success("Zona eliminada");
          
          const { zones } = get();
          set({ zones: zones.filter(z => z.id !== zoneId) });
          onSuccess();
        } catch (error) {
          console.error('Error deleting zone:', error);
          toast.error("Error al eliminar la zona");
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Member/Invitation management actions - REMOVED (Phase 4)
      // All member operations moved to membersStore
      // All invitation operations moved to invitationStore
      
      // Home config actions
      setHomeName: (name) => set({ homeName: name }),
      setGroupGoal: (goal) => set({ groupGoal: goal }),
      setRotationPolicy: (policy) => set({ rotationPolicy: policy }),
      setRotationEnabled: (enabled) => set({ rotationEnabled: enabled }),
      
      initializeHomeConfig: (name: string, goal: number, policy: string, enabled: boolean) => {
        set({
          homeName: name,
          groupGoal: goal,
          rotationPolicy: policy,
          rotationEnabled: enabled,
        });
      },
      
      saveHomeConfig: async (homeId: number, onSuccess: () => void) => {
        const { homeName, groupGoal, rotationPolicy, rotationEnabled } = get();
        
        if (!homeName.trim()) {
          toast.error("El nombre de la casa es requerido");
          return;
        }

        set({ isLoading: true });
        try {
          // TODO: Implement updateHomeConfig in db
          toast.info("Función en desarrollo");
          // await db.updateHomeConfig(homeId, {
          //   name: homeName.trim(),
          //   goal_percentage: groupGoal,
          //   rotation_policy: rotationPolicy as any,
          //   auto_rotation: rotationEnabled
          // });
          // toast.success("Configuración guardada");
          onSuccess();
        } catch (error) {
          console.error('Error saving config:', error);
          toast.error("Error al guardar configuración");
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    { name: 'HomeManagementStore' }
  )
);
