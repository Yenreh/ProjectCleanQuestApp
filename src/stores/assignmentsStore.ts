import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from '../lib/db';
import type { AssignmentWithDetails, CancelledTaskWithDetails } from '../lib/types';
import { toast } from 'sonner';
import { useMasteryStore } from './masteryStore';
import { useAchievementsStore } from './achievementsStore';

interface AssignmentsState {
  // State
  assignments: AssignmentWithDetails[];
  favoriteTasks: Set<number>;
  isLoading: boolean;
  
  // Available tasks state
  availableTasks: CancelledTaskWithDetails[];
  isLoadingAvailable: boolean;
  takingTaskId: string | null;
  
  // Dialog states - UI booleans moved to uiStore
  // taskDialogOpen, swapModalOpen, cancelDialogOpen, availableTasksOpen → use useUIStore
  
  // Domain data (stays here)
  currentTaskDialog: AssignmentWithDetails | null;
  completedStepsInDialog: Set<number>;
  taskToSwap: AssignmentWithDetails | null;
  taskToCancel: AssignmentWithDetails | null;
  
  // Loading states for actions
  togglingStepId: number | null;
  togglingFavoriteId: number | null;
  
  // Actions
  setAssignments: (assignments: AssignmentWithDetails[]) => void;
  setFavoriteTasks: (favorites: Set<number>) => void;
  setLoading: (loading: boolean) => void;
  loadAssignments: (memberId: number, homeId: number) => Promise<void>;
  
  // Dialog actions
  openTaskDialog: (assignment: AssignmentWithDetails) => Promise<void>;
  closeTaskDialog: () => void;
  // setTaskDialogOpen, setSwapModalOpen, setCancelDialogOpen, setAvailableTasksOpen → use useUIStore
  
  setCompletedStepsInDialog: (steps: Set<number>) => void;
  setTaskToSwap: (task: AssignmentWithDetails | null) => void;
  setTaskToCancel: (task: AssignmentWithDetails | null) => void;
  
  // Assignment actions
  toggleStep: (stepId: number, assignment: AssignmentWithDetails, memberId: number) => Promise<void>;
  completeTask: (assignmentId: number, memberId: number, homeId: number) => Promise<void>;
  completeTaskFromDialog: (memberId: number, homeId: number) => Promise<void>;
  toggleFavorite: (taskId: number, memberId: number) => Promise<void>;
  updateAssignmentProgress: (assignmentId: number, stepId?: number, isCompleting?: boolean) => void;
  
  // Dialog-specific actions
  cancelTask: (assignmentId: number, memberId: number, reason: string) => Promise<void>;
  takeCancelledTask: (cancellationId: number, memberId: number, taskId: number) => Promise<void>;
  loadAvailableTasks: (homeId: number) => Promise<void>;
}

export const useAssignmentsStore = create<AssignmentsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      assignments: [],
      favoriteTasks: new Set(),
      isLoading: true,
      
      // Available tasks state
      availableTasks: [],
      isLoadingAvailable: false,
      takingTaskId: null,
      
      // Dialog states - UI booleans in uiStore
      currentTaskDialog: null,
      completedStepsInDialog: new Set(),
      taskToSwap: null,
      taskToCancel: null,
      
      // Loading states
      togglingStepId: null,
      togglingFavoriteId: null,
      
      // Actions
      setAssignments: (assignments) => set({ assignments }),
      
      setFavoriteTasks: (favorites) => set({ favoriteTasks: favorites }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      loadAssignments: async (memberId: number, homeId: number) => {
        set({ isLoading: true });
        try {
          const [myAssignments, memberFavorites] = await Promise.all([
            db.getMyAssignments(memberId, 'pending'),
            db.getMemberFavorites(memberId)
          ]);
          
          set({
            assignments: myAssignments,
            favoriteTasks: new Set(memberFavorites),
            isLoading: false
          });
        } catch (error) {
          console.error('Error loading assignments:', error);
          toast.error('Error al cargar tareas');
          set({ isLoading: false });
        }
      },
      
      // Dialog actions
      openTaskDialog: async (assignment: AssignmentWithDetails) => {
        set({ currentTaskDialog: assignment });
        
        try {
          const completions = await db.getStepCompletions(assignment.id);
          const completedStepIds = completions.map((c: any) => c.step_id);
          set({ 
            completedStepsInDialog: new Set(completedStepIds)
          });
          // taskDialogOpen moved to uiStore - component should call useUIStore().setTaskDialogOpen(true)
        } catch (error) {
          console.error('Error loading step completions:', error);
          const completedStepIds = (assignment as any).completed_step_ids || [];
          set({ 
            completedStepsInDialog: new Set(completedStepIds)
          });
          // taskDialogOpen moved to uiStore - component should call useUIStore().setTaskDialogOpen(true)
        }
      },
      
      closeTaskDialog: () => set({ 
        currentTaskDialog: null, 
        completedStepsInDialog: new Set() 
      }),
      // taskDialogOpen closing moved to uiStore - component should call useUIStore().setTaskDialogOpen(false)
      
      setCompletedStepsInDialog: (steps) => set({ completedStepsInDialog: steps }),
      
      // UI dialog setters moved to uiStore:
      // setTaskDialogOpen, setSwapModalOpen, setCancelDialogOpen, setAvailableTasksOpen
      
      setTaskToSwap: (task) => set({ taskToSwap: task }),
      
      setTaskToCancel: (task) => set({ taskToCancel: task }),
      
      // Assignment actions
      toggleStep: async (stepId: number, assignment: AssignmentWithDetails, memberId: number) => {
        const { completedStepsInDialog, togglingStepId, updateAssignmentProgress } = get();
        
        if (togglingStepId) return;
        
        const isCompleted = completedStepsInDialog.has(stepId);
        
        // Store previous states for rollback
        const prevCompletedSteps = new Set(completedStepsInDialog);
        const prevTaskDialog = assignment;
        
        set({ togglingStepId: stepId });
        
        // Optimistic UI update
        if (isCompleted) {
          const newSet = new Set(completedStepsInDialog);
          newSet.delete(stepId);
          set({ completedStepsInDialog: newSet });
          
          set((state) => ({
            currentTaskDialog: state.currentTaskDialog ? {
              ...state.currentTaskDialog,
              completed_step_ids: ((state.currentTaskDialog as any).completed_step_ids || []).filter((id: number) => id !== stepId)
            } as any : null
          }));
          
          updateAssignmentProgress(assignment.id, stepId, false);
        } else {
          set({ completedStepsInDialog: new Set([...completedStepsInDialog, stepId]) });
          
          set((state) => ({
            currentTaskDialog: state.currentTaskDialog ? {
              ...state.currentTaskDialog,
              completed_step_ids: [...((state.currentTaskDialog as any).completed_step_ids || []), stepId]
            } as any : null
          }));
          
          updateAssignmentProgress(assignment.id, stepId, true);
        }
        
        try {
          if (isCompleted) {
            await db.uncompleteTaskStep(stepId, assignment.id);
            toast.success('Paso desmarcado');
          } else {
            await db.completeTaskStep(stepId, assignment.id, memberId);
            toast.success('Paso completado');
          }
        } catch (error) {
          console.error('Error toggling step:', error);
          toast.error('Error al actualizar paso');
          
          // Rollback
          set({ 
            completedStepsInDialog: prevCompletedSteps,
            currentTaskDialog: prevTaskDialog
          });
          updateAssignmentProgress(assignment.id, stepId, !isCompleted);
        } finally {
          set({ togglingStepId: null });
        }
      },
      
      completeTask: async (assignmentId: number, memberId: number, homeId: number) => {
        const { assignments } = get();
        const prevAssignments = assignments;
        
        try {
          // Optimistic UI update
          set({ assignments: assignments.filter(a => a.id !== assignmentId) });
          
          await db.completeTask(assignmentId, memberId);
          
          toast.success('¡Tarea completada!');
          
          // Check for level up and achievements in background
          // Use centralized stores for mastery and achievements
          const masteryStore = useMasteryStore.getState();
          const achievementsStore = useAchievementsStore.getState();
          
          // Check for level up first
          const newLevel = await masteryStore.updateMasteryLevel(memberId);
          
          // Then check for achievements (with staggered timing if level up occurred)
          setTimeout(async () => {
            await achievementsStore.checkAndUnlock(memberId);
          }, newLevel ? 800 : 0);
        } catch (error) {
          console.error('Error completing task:', error);
          toast.error('Error al completar tarea');
          set({ assignments: prevAssignments });
        }
      },
      
      completeTaskFromDialog: async (memberId: number, homeId: number) => {
        const { currentTaskDialog, completedStepsInDialog, closeTaskDialog } = get();
        
        if (!currentTaskDialog) return;
        
        // Check required steps
        const requiredSteps = currentTaskDialog.task_steps?.filter(step => !step.is_optional) || [];
        const requiredStepIds = new Set(requiredSteps.map(step => step.id));
        const completedRequiredSteps = Array.from(completedStepsInDialog).filter(id => requiredStepIds.has(id));
        
        if (requiredSteps.length > 0 && completedRequiredSteps.length < requiredSteps.length) {
          toast.error(`Completa todos los pasos obligatorios (${completedRequiredSteps.length}/${requiredSteps.length})`);
          return;
        }
        
        closeTaskDialog();
        await get().completeTask(currentTaskDialog.id, memberId, homeId);
      },
      
      toggleFavorite: async (taskId: number, memberId: number) => {
        const { favoriteTasks, togglingFavoriteId } = get();
        
        if (togglingFavoriteId) return;
        
        const isFavorite = favoriteTasks.has(taskId);
        const prevFavorites = new Set(favoriteTasks);
        
        set({ togglingFavoriteId: taskId });
        
        // Optimistic UI update
        const newFavorites = new Set(favoriteTasks);
        if (isFavorite) {
          newFavorites.delete(taskId);
        } else {
          newFavorites.add(taskId);
        }
        set({ favoriteTasks: newFavorites });
        
        try {
          if (isFavorite) {
            await db.removeTaskFavorite(taskId, memberId);
            toast.success('Quitado de favoritos');
          } else {
            await db.addTaskFavorite(taskId, memberId);
            toast.success('Agregado a favoritos');
          }
        } catch (error) {
          console.error('Error toggling favorite:', error);
          toast.error('Error al actualizar favorito');
          set({ favoriteTasks: prevFavorites });
        } finally {
          set({ togglingFavoriteId: null });
        }
      },
      
      updateAssignmentProgress: (assignmentId: number, stepId?: number, isCompleting: boolean = true) => {
        set((state) => ({
          assignments: state.assignments.map(a => {
            if (a.id !== assignmentId) return a;
            if (!a.task_steps || a.task_steps.length === 0) return a;
            
            const currentCompletedSteps = (a as any).completed_steps_count || 0;
            const newCompletedStepsCount = stepId 
              ? (isCompleting ? currentCompletedSteps + 1 : currentCompletedSteps - 1)
              : currentCompletedSteps;
            
            let completedRequiredCount = (a as any).completed_required_steps || 0;
            if (stepId) {
              const step = a.task_steps.find(s => s.id === stepId);
              if (step && !step.is_optional) {
                completedRequiredCount = isCompleting ? completedRequiredCount + 1 : completedRequiredCount - 1;
              }
            }
            
            const currentCompletedIds = (a as any).completed_step_ids || [];
            let newCompletedIds = [...currentCompletedIds];
            if (stepId) {
              if (isCompleting) {
                if (!newCompletedIds.includes(stepId)) {
                  newCompletedIds.push(stepId);
                }
              } else {
                newCompletedIds = newCompletedIds.filter(id => id !== stepId);
              }
            }
            
            const requiredSteps = a.task_steps.filter(s => !s.is_optional);
            
            return {
              ...a,
              completed_steps_count: Math.max(0, newCompletedStepsCount),
              completed_required_steps: Math.max(0, completedRequiredCount),
              total_required_steps: requiredSteps.length,
              has_partial_progress: newCompletedStepsCount > 0,
              completed_step_ids: newCompletedIds
            } as any;
          })
        }));
      },
      
      // Dialog-specific actions
      cancelTask: async (assignmentId: number, memberId: number, reason: string) => {
        try {
          await db.cancelTask(assignmentId, memberId, reason);
          toast.success('Tarea cancelada correctamente', {
            description: 'Tus compañeros podrán verla y tomarla si desean'
          });
          
          // Remove from assignments list
          set((state) => ({
            assignments: state.assignments.filter(a => a.id !== assignmentId)
          }));
        } catch (error) {
          console.error('Error canceling task:', error);
          toast.error('Error al cancelar la tarea');
          throw error;
        }
      },
      
      takeCancelledTask: async (cancellationId: number, memberId: number, taskId: number) => {
        try {
          await db.takeCancelledTask(cancellationId, memberId, taskId);
          toast.success('Tarea tomada exitosamente', {
            description: 'Ahora aparecerá en tu lista de tareas pendientes'
          });
        } catch (error) {
          console.error('Error taking task:', error);
          toast.error('Error al tomar la tarea');
          throw error;
        }
      },
      
      loadAvailableTasks: async (homeId: number) => {
        set({ isLoadingAvailable: true });
        try {
          const tasks = await db.getAvailableCancelledTasks(homeId);
          set({ availableTasks: tasks });
        } catch (error) {
          console.error('Error loading available tasks:', error);
          toast.error('Error al cargar tareas disponibles');
        } finally {
          set({ isLoadingAvailable: false });
        }
      }
    }),
    { name: 'AssignmentsStore' }
  )
);
