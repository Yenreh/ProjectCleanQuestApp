import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { CheckCircle2, Circle, XCircle, TrendingUp, Zap, Users, Clock, Trash2, UtensilsCrossed, Sparkles, Loader2, AlertCircle, ClipboardList, Heart, ArrowRightLeft, Ban, Lightbulb } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { CancelTaskDialog } from "../dialogs/CancelTaskDialog";
import { AvailableTasksDialog } from "../dialogs/AvailableTasksDialog";
import { CompleteTaskDialog } from "../dialogs/CompleteTaskDialog";
import { db } from "../../lib/db";
import { toast } from "sonner";
import type { AssignmentWithDetails, HomeMember, HomeMetrics, Profile } from "../../lib/types";

type MasteryLevel = "novice" | "solver" | "expert" | "master" | "visionary";

interface HomeScreenProps {
  masteryLevel: MasteryLevel;
  currentMember?: HomeMember | null;
  currentUser?: Profile | null;
  homeId?: number | null;
  onLevelUpdate?: (newLevel: MasteryLevel) => void;
}

export const HomeView = memo(function HomeView({ masteryLevel, currentMember, currentUser, homeId, onLevelUpdate }: HomeScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [metrics, setMetrics] = useState<HomeMetrics | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [currentTaskDialog, setCurrentTaskDialog] = useState<AssignmentWithDetails | null>(null);
  const [completedStepsInDialog, setCompletedStepsInDialog] = useState<Set<number>>(new Set());
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [taskToSwap, setTaskToSwap] = useState<AssignmentWithDetails | null>(null);
  const [favoriteTasks, setFavoriteTasks] = useState<Set<number>>(new Set());
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [taskToCancel, setTaskToCancel] = useState<AssignmentWithDetails | null>(null);
  const [availableTasksOpen, setAvailableTasksOpen] = useState(false);
  
  // Loading states for actions
  const [togglingStepId, setTogglingStepId] = useState<number | null>(null);
  const [togglingFavoriteId, setTogglingFavoriteId] = useState<number | null>(null);
  
  const userName = currentUser?.full_name || currentUser?.email?.split('@')[0] || "Usuario";

  // OPTIMIZATION: Memoize computed values
  const completionPercentage = useMemo(() => metrics?.completion_percentage || 0, [metrics?.completion_percentage]);
  const rotationPercentage = useMemo(() => metrics?.rotation_percentage || 0, [metrics?.rotation_percentage]);
  const completedCount = useMemo(() => assignments.filter(a => a.status === 'completed').length, [assignments]);

  // OPTIMIZATION: Memoize loadData function with useCallback
  const loadData = useCallback(async () => {
    if (!currentMember || !homeId) return;
    
    setIsLoading(true);
    try {
      const [myAssignments, homeMetrics, memberFavorites] = await Promise.all([
        db.getMyAssignments(currentMember.id, 'pending'),
        db.getHomeMetrics(homeId),
        db.getMemberFavorites(currentMember.id)
      ]);
      
      // getMyAssignments already includes step completions count via batch loading
      // No need to call getStepCompletions again - it's already optimized in db.ts
      setAssignments(myAssignments);
      setMetrics(homeMetrics);
      setFavoriteTasks(new Set(memberFavorites));
    } catch (error) {
      console.error('Error loading home data:', error);
      toast.error('Error al cargar tareas');
    } finally {
      setIsLoading(false);
    }
  }, [currentMember, homeId]); // Only re-create when dependencies change

  const openTaskDialog = async (assignment: AssignmentWithDetails) => {
    setCurrentTaskDialog(assignment);
    
    // Reload step completions from database to ensure fresh state
    try {
      const completions = await db.getStepCompletions(assignment.id);
      const completedStepIds = completions.map((c: any) => c.step_id);
      setCompletedStepsInDialog(new Set(completedStepIds));
    } catch (error) {
      console.error('Error loading step completions:', error);
      // Fallback to cached data
      const completedStepIds = (assignment as any).completed_step_ids || [];
      setCompletedStepsInDialog(new Set(completedStepIds));
    }
    
    setTaskDialogOpen(true);
  };

  const handleToggleStep = async (stepId: number) => {
    if (!currentTaskDialog || !currentMember || togglingStepId) return;

    const isCompleted = completedStepsInDialog.has(stepId);
    
    setTogglingStepId(stepId);
    try {
      if (isCompleted) {
        await db.uncompleteTaskStep(stepId, currentTaskDialog.id);
        setCompletedStepsInDialog(prev => {
          const newSet = new Set(prev);
          newSet.delete(stepId);
          return newSet;
        });
        
        // Update currentTaskDialog with new completed_step_ids
        setCurrentTaskDialog(prev => {
          if (!prev) return prev;
          const currentIds = (prev as any).completed_step_ids || [];
          return {
            ...prev,
            completed_step_ids: currentIds.filter((id: number) => id !== stepId)
          } as any;
        });
        
        toast.success('Paso desmarcado');
        // Update assignment progress when uncompleting
        updateAssignmentProgress(currentTaskDialog.id, stepId, false);
      } else {
        await db.completeTaskStep(stepId, currentTaskDialog.id, currentMember.id);
        setCompletedStepsInDialog(prev => new Set([...prev, stepId]));
        
        // Update currentTaskDialog with new completed_step_ids
        setCurrentTaskDialog(prev => {
          if (!prev) return prev;
          const currentIds = (prev as any).completed_step_ids || [];
          return {
            ...prev,
            completed_step_ids: [...currentIds, stepId]
          } as any;
        });
        
        toast.success('Paso completado');
        // Update assignment progress when completing
        updateAssignmentProgress(currentTaskDialog.id, stepId, true);
      }
    } catch (error) {
      console.error('Error toggling step:', error);
      toast.error('Error al actualizar paso');
    } finally {
      setTogglingStepId(null);
    }
  };

  const updateAssignmentProgress = async (assignmentId: number, stepId?: number, isCompleting: boolean = true) => {
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment || !assignment.task_steps || assignment.task_steps.length === 0) return;

      // Calculate new progress based on action
      const currentCompletedSteps = (assignment as any).completed_steps_count || 0;
      const newCompletedStepsCount = stepId 
        ? (isCompleting ? currentCompletedSteps + 1 : currentCompletedSteps - 1)
        : currentCompletedSteps;
      
      // For required steps, we need to check if the step is required
      let completedRequiredCount = (assignment as any).completed_required_steps || 0;
      if (stepId) {
        const step = assignment.task_steps.find(s => s.id === stepId);
        if (step && !step.is_optional) {
          completedRequiredCount = isCompleting ? completedRequiredCount + 1 : completedRequiredCount - 1;
        }
      }

      const requiredSteps = assignment.task_steps.filter(s => !s.is_optional);

      // Update only this assignment in the state
      setAssignments(prev => prev.map(a => 
        a.id === assignmentId 
          ? {
              ...a,
              completed_steps_count: Math.max(0, newCompletedStepsCount),
              completed_required_steps: Math.max(0, completedRequiredCount),
              total_required_steps: requiredSteps.length,
              has_partial_progress: newCompletedStepsCount > 0
            } as any
          : a
      ));
    } catch (error) {
      console.error('Error updating assignment progress:', error);
    }
  };

  // Helper function to show toasts sequentially without overlap
  const showCompletionToasts = async (memberId: number, delayOffset = 0) => {
    const levelNames = {
      'solver': 'Solucionador',
      'expert': 'Experto',
      'master': 'Maestro',
      'visionary': 'Visionario'
    };

    // Base toast
    toast.success('¡Tarea completada!');
    
    // Check for level up
    const newLevel = await db.updateMasteryLevel(memberId);
    let hasLevelUp = false;
    
    if (newLevel) {
      hasLevelUp = true;
      onLevelUpdate?.(newLevel);
      setTimeout(() => {
        toast.success(`🎉 ¡Subiste de nivel a ${levelNames[newLevel as keyof typeof levelNames]}!`, {
          description: 'Ahora tienes acceso a nuevas funciones',
          duration: 4000,
        });
      }, 800 + delayOffset);
    }
    
    // Check for unlocked achievements
    const unlockedAchievements = await db.checkAndUnlockAchievements(memberId);
    if (unlockedAchievements.length > 0) {
      setTimeout(() => {
        toast.success(`🏆 ¡Insignia desbloqueada: ${unlockedAchievements[0].title}!`, {
          description: unlockedAchievements[0].description,
          duration: 4000,
        });
      }, hasLevelUp ? 1800 + delayOffset : 1000 + delayOffset);
    }
  };

  const handleCompleteTaskFromDialog = async () => {
    if (!currentTaskDialog || !currentMember) return;

    // Only check required (non-optional) steps
    const requiredSteps = currentTaskDialog.task_steps?.filter(step => !step.is_optional) || [];
    const requiredStepIds = new Set(requiredSteps.map(step => step.id));
    const completedRequiredSteps = Array.from(completedStepsInDialog).filter(id => requiredStepIds.has(id));

    if (requiredSteps.length > 0 && completedRequiredSteps.length < requiredSteps.length) {
      toast.error(`Completa todos los pasos obligatorios (${completedRequiredSteps.length}/${requiredSteps.length})`);
      return;
    }

    try {
      await db.completeTask(currentTaskDialog.id, currentMember.id);
      
      // Show completion toasts sequentially
      await showCompletionToasts(currentMember.id);
      
      setTaskDialogOpen(false);
      setCurrentTaskDialog(null);
      setCompletedStepsInDialog(new Set());
      
      // Optimistic UI update: remove completed task from state
      setAssignments(prev => prev.filter(a => a.id !== currentTaskDialog.id));
      
      // Update metrics optimistically
      setMetrics(prev => prev ? {
        ...prev,
        completed_tasks: prev.completed_tasks + 1,
        pending_tasks: Math.max(0, prev.pending_tasks - 1),
        completion_percentage: Math.round(((prev.completed_tasks + 1) / prev.total_tasks) * 100)
      } : null);
      
      // Reload only metrics in background (lightweight query)
      if (homeId) {
        db.getHomeMetrics(homeId).then(setMetrics).catch(console.error);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Error al completar tarea');
    }
  };

  const handleCompleteTask = async (assignmentId: number) => {
    if (!currentMember) return;
    
    try {
      await db.completeTask(assignmentId, currentMember.id);
      
      // Show completion toasts sequentially
      await showCompletionToasts(currentMember.id);
      
      // Optimistic UI update: remove completed task from state
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      
      // Update metrics optimistically
      setMetrics(prev => prev ? {
        ...prev,
        completed_tasks: prev.completed_tasks + 1,
        pending_tasks: Math.max(0, prev.pending_tasks - 1),
        completion_percentage: Math.round(((prev.completed_tasks + 1) / prev.total_tasks) * 100)
      } : null);
      
      // Reload only metrics in background (lightweight query)
      if (homeId) {
        db.getHomeMetrics(homeId).then(setMetrics).catch(console.error);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Error al completar tarea');
    }
  };

  const handleToggleFavorite = async (taskId: number) => {
    if (!currentMember || togglingFavoriteId) return;

    const isFavorite = favoriteTasks.has(taskId);
    
    setTogglingFavoriteId(taskId);
    try {
      if (isFavorite) {
        await db.removeTaskFavorite(taskId, currentMember.id);
        setFavoriteTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
        toast.success('Quitado de favoritos');
      } else {
        await db.addTaskFavorite(taskId, currentMember.id);
        setFavoriteTasks(prev => new Set([...prev, taskId]));
        toast.success('Agregado a favoritos');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Error al actualizar favoritos');
    } finally {
      setTogglingFavoriteId(null);
    }
  };

  const handleOpenSwapModal = (assignment: AssignmentWithDetails) => {
    setTaskToSwap(assignment);
    setSwapModalOpen(true);
  };

  const handleSwapTask = async (targetAssignmentId: number) => {
    if (!taskToSwap || !currentMember) return;

    try {
      await db.requestTaskExchange(currentMember.id, taskToSwap.id, 'swap', undefined, `Solicitud de intercambio con tarea ${targetAssignmentId}`);
      toast.success('Solicitud de intercambio enviada');
      setSwapModalOpen(false);
      setTaskToSwap(null);
    } catch (error) {
      console.error('Error requesting swap:', error);
      toast.error('Error al solicitar intercambio');
    }
  };

  // OPTIMIZATION: Memoize helper functions
  const getTaskIcon = useCallback((iconName?: string) => {
    switch (iconName) {
      case 'trash': return <Trash2 className="w-5 h-5" />;
      case 'utensils': return <UtensilsCrossed className="w-5 h-5" />;
      case 'sparkles': return <Sparkles className="w-5 h-5" />;
      default: return <CheckCircle2 className="w-5 h-5" />;
    }
  }, []);

  // OPTIMIZATION: Memoize task card background calculation
  const getTaskCardBackground = useCallback((assignment: AssignmentWithDetails) => {
    if (assignment.status === 'completed') return '';
    
    if (!assignment.task_steps || assignment.task_steps.length === 0) return '';
    
    const totalRequired = (assignment as any).total_required_steps;
    const completedRequired = (assignment as any).completed_required_steps;
    const hasPartialProgress = (assignment as any).has_partial_progress;
    
    if (totalRequired === undefined || completedRequired === undefined) return '';
    
    // Check if all required steps are completed
    if (totalRequired > 0 && completedRequired >= totalRequired) {
      return 'bg-[#e9f5f0]'; // Verde muy suave (mismo color de badges de éxito) - listo para completar
    } else if (hasPartialProgress) {
      return 'bg-[#fff4e6]'; // Naranja muy suave - trabajo en progreso
    }
    
    return '';
  }, []);

  // Load tasks and metrics
  useEffect(() => {
    if (currentMember && homeId) {
      loadData();
      // Update weeks active on mount
      db.updateWeeksActive(currentMember.id).catch(err => 
        console.error('Error updating weeks active:', err)
      );
    }
  }, [currentMember, homeId]); // loadData is memoized with these dependencies, no need to include it

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#6fbd9d] animate-spin mb-4" />
        <p className="text-muted-foreground">Cargando tareas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 py-8 max-w-md mx-auto min-h-screen">
      {/* Header */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1>¡Bienvenido/a, {userName}!</h1>
          {(import.meta as any).env?.VITE_DEV_MODE === 'true' && (
            <Badge className="bg-[#e9f5f0] text-[#6fbd9d]">
              {masteryLevel === "novice" && "Novato"}
              {masteryLevel === "solver" && "Solucionador"}
              {masteryLevel === "expert" && "Experto"}
              {masteryLevel === "master" && "Maestro"}
              {masteryLevel === "visionary" && "Visionario"}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          {masteryLevel === "novice" && "Tu primera semana en CleanQuest"}
          {masteryLevel === "solver" && "Entendiendo cómo funciona el sistema"}
          {masteryLevel === "expert" && "Optimiza y planifica estratégicamente"}
          {masteryLevel === "master" && "Controla metas y políticas del hogar"}
          {masteryLevel === "visionary" && "Propón mejoras e innovaciones"}
        </p>
      </div>

      {/* Circular Progress */}
      <div className="relative w-48 h-48 mb-6">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#e9f5f0"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#6fbd9d"
            strokeWidth="8"
            strokeDasharray={`${completionPercentage * 2.51} ${(100 - completionPercentage) * 2.51}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl" style={{ fontWeight: 600 }}>{completionPercentage}%</span>
          <span className="text-sm text-muted-foreground">Completado</span>
        </div>
      </div>

      {/* NOVICE: Rotation Status (visible for all levels) */}
      <div className="w-full mb-4">
        {rotationPercentage <= 33 ? (
          <Badge className="bg-[#e9f5f0] text-[#6fbd9d] px-3 py-2 w-full justify-center">
            ✓ Rotación equilibrada ({rotationPercentage}%)
          </Badge>
        ) : (
          <Badge className="bg-[#fff4e6] text-[#d97706] px-3 py-2 w-full justify-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            Alerta: Rotación desbalanceada ({rotationPercentage}%)
          </Badge>
        )}
      </div>

      {/* SOLVER+: Available Cancelled Tasks Button */}
      {(masteryLevel === "solver" || masteryLevel === "expert" || masteryLevel === "master" || masteryLevel === "visionary") && (
        <Button 
          variant="outline" 
          className="w-full mb-4"
          onClick={() => setAvailableTasksOpen(true)}
        >
          <ClipboardList className="w-4 h-4 mr-2" />
          Ver tareas disponibles
        </Button>
      )}

      {/* Main Action Button */}
      <Button 
        size="lg" 
        className="w-full mb-6 h-14 bg-[#6fbd9d] hover:bg-[#5fa989]"
        disabled={assignments.length === 0 || !assignments.some(a => a.status === 'pending')}
        onClick={() => {
          const firstPendingTask = assignments.find(a => a.status === 'pending');
          if (firstPendingTask) {
            openTaskDialog(firstPendingTask);
          }
        }}
      >
        Iniciar tarea de hoy
      </Button>

      {/* Tasks List */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3>
            {masteryLevel === "novice" && "Checklist de mi semana"}
            {masteryLevel !== "novice" && "Tareas pendientes"}
          </h3>
          {masteryLevel === "novice" && (
            <span className="text-sm text-muted-foreground">{completedCount}/{assignments.length}</span>
          )}
        </div>
        {assignments.length === 0 ? (
          <Card className="p-8 text-center bg-[#f5f3ed]">
            <Sparkles className="w-12 h-12 text-[#d4a574] mx-auto mb-4" />
            <h3 className="mb-2">No hay tareas pendientes</h3>
            <p className="text-sm text-muted-foreground">
              ¡Excelente trabajo! Todas las tareas están completadas.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">{assignments.map((assignment) => {
            const cardBgColor = getTaskCardBackground(assignment);
            const isFavorite = favoriteTasks.has(assignment.task_id);
            return (
              <Card 
                key={assignment.id} 
                className={`p-4 transition-all hover:shadow-md ${cardBgColor}`}
              >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${assignment.status === 'completed' ? 'bg-[#e9f5f0] text-[#6fbd9d]' : 'bg-[#f5f3ed] text-[#d4a574]'}`}>
                    {getTaskIcon(assignment.task_icon)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span 
                        className={`cursor-pointer ${assignment.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}
                        onClick={() => {
                          if (assignment.status !== 'completed') {
                            openTaskDialog(assignment);
                          }
                        }}
                      >
                        {assignment.task_title}
                      </span>
                      {assignment.task_zone_name && (
                        <Badge variant="outline" className="text-xs">
                          {assignment.task_zone_name}
                        </Badge>
                      )}
                    </div>
                    {(masteryLevel === "solver" || masteryLevel === "expert" || masteryLevel === "master" || masteryLevel === "visionary") && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(assignment.assigned_date).toLocaleDateString('es-CO', { weekday: 'short' })}
                        </span>
                        {assignment.task_effort && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">Esfuerzo: {assignment.task_effort}</span>
                          </>
                        )}
                        {assignment.task_steps && assignment.task_steps.length > 0 && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {assignment.completed_steps_count || 0}/{assignment.task_steps.length} pasos
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {assignment.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-[#6fbd9d]" />
                  ) : (
                    <>
                      {(masteryLevel === "expert" || masteryLevel === "master" || masteryLevel === "visionary") && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleToggleFavorite(assignment.task_id);
                            }}
                            disabled={togglingFavoriteId === assignment.task_id}
                          >
                            {togglingFavoriteId === assignment.task_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleOpenSwapModal(assignment);
                            }}
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {(masteryLevel === "solver" || masteryLevel === "expert" || masteryLevel === "master" || masteryLevel === "visionary") && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setTaskToCancel(assignment);
                            setCancelDialogOpen(true);
                          }}
                        >
                          <Ban className="w-4 h-4 text-amber-500" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
            );
          })}</div>
        )}
      </div>

      {/* NOVICE: Contextual Tips */}
      {masteryLevel === "novice" && (
        <Card className="p-4 w-full bg-[#f0f7ff] mb-6">
          <div className="flex gap-3">
            <Lightbulb className="w-5 h-5 text-[#89a7c4] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="mb-2">Consejos</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Meta: Completar 80% esta semana</p>
                <p>• Mantén rotación bajo 33%</p>
                <p>• Las tareas rotan automáticamente</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Task Details Dialog */}
      <CompleteTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={currentTaskDialog}
        completedSteps={completedStepsInDialog}
        onToggleStep={handleToggleStep}
        onCompleteTask={handleCompleteTaskFromDialog}
        onClose={() => {
          setTaskDialogOpen(false);
          setCurrentTaskDialog(null);
          setCompletedStepsInDialog(new Set());
        }}
        getTaskIcon={getTaskIcon}
        togglingStepId={togglingStepId}
      />

      {/* Swap Task Modal */}
      <Dialog open={swapModalOpen} onOpenChange={setSwapModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-[#89a7c4]" />
              <span>Intercambiar tarea</span>
            </DialogTitle>
            <DialogDescription>
              Selecciona con quién intercambiar tu tarea
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {taskToSwap && (
              <div className="p-3 bg-[#f5f3ed] rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Tarea a intercambiar:</p>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white text-[#d4a574]">
                    {getTaskIcon(taskToSwap.task_icon)}
                  </div>
                  <span className="font-medium">{taskToSwap.task_title}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Otras tareas pendientes:</p>
              {assignments
                .filter(a => a.id !== taskToSwap?.id && a.status === 'pending')
                .map(assignment => (
                  <button
                    key={assignment.id}
                    onClick={() => handleSwapTask(assignment.id)}
                    className="w-full p-3 bg-white border border-border rounded-lg hover:bg-[#f5f3ed] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#f5f3ed] text-[#d4a574]">
                        {getTaskIcon(assignment.task_icon)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{assignment.task_title}</p>
                        {assignment.task_zone_name && (
                          <p className="text-xs text-muted-foreground">
                            {assignment.task_zone_name}
                          </p>
                        )}
                      </div>
                      <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSwapModalOpen(false);
                setTaskToSwap(null);
              }}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Task Dialog */}
      <CancelTaskDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        assignment={taskToCancel}
        memberId={currentMember?.id || 0}
        onSuccess={async () => {
          // Optimistic UI update: remove cancelled task
          if (taskToCancel) {
            setAssignments(prev => prev.filter(a => a.id !== taskToCancel.id));
            setMetrics(prev => prev ? {
              ...prev,
              pending_tasks: Math.max(0, prev.pending_tasks - 1)
            } : null);
          }
          setTaskToCancel(null);
          
          // Reload only metrics in background
          if (homeId) {
            db.getHomeMetrics(homeId).then(setMetrics).catch(console.error);
          }
        }}
      />

      {/* Available Tasks Dialog */}
      <AvailableTasksDialog
        open={availableTasksOpen}
        onOpenChange={setAvailableTasksOpen}
        homeId={homeId || 0}
        currentMemberId={currentMember?.id || 0}
        onTaskTaken={async () => {
          // Reload assignments to show new task
          if (currentMember && homeId) {
            const myAssignments = await db.getMyAssignments(currentMember.id, 'pending');
            setAssignments(myAssignments);
            
            // Update metrics in background
            db.getHomeMetrics(homeId).then(setMetrics).catch(console.error);
          }
        }}
      />
    </div>
  );
});
