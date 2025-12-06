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
import { SwapTaskDialog } from "../dialogs/SwapTaskDialog";
import { db } from "../../lib/db";
import { toast } from "sonner";
import type { AssignmentWithDetails, HomeMember, HomeMetrics, Profile } from "../../lib/types";
import { useAssignmentsStore, useHomeStore, useUIStore } from "../../stores";

type MasteryLevel = "novice" | "solver" | "expert" | "master" | "visionary";

interface HomeScreenProps {
  masteryLevel: MasteryLevel;
  currentMember?: HomeMember | null;
  currentUser?: Profile | null;
  homeId?: number | null;
  onLevelUpdate?: (newLevel: MasteryLevel) => void;
}

export const HomeView = memo(function HomeView({ masteryLevel, currentMember, currentUser, homeId, onLevelUpdate }: HomeScreenProps) {
  // Store state
  const {
    assignments,
    favoriteTasks,
    isLoading,
    currentTaskDialog,
    completedStepsInDialog,
    taskToSwap,
    taskToCancel,
    togglingStepId,
    togglingFavoriteId,
    loadAssignments,
    openTaskDialog,
    closeTaskDialog,
    setTaskToSwap,
    setTaskToCancel,
    toggleStep,
    completeTask,
    completeTaskFromDialog,
    toggleFavorite,
  } = useAssignmentsStore();
  
  // UI dialog states
  const {
    taskDialogOpen,
    swapModalOpen,
    cancelDialogOpen,
    availableTasksOpen,
    setTaskDialogOpen,
    setSwapModalOpen,
    setCancelDialogOpen,
    setAvailableTasksOpen,
  } = useUIStore();
  
  // Metrics from homeStore or local state (metrics is view-specific for now)
  const [metrics, setMetrics] = useState<HomeMetrics | null>(null);
  
  const userName = currentUser?.full_name || currentUser?.email?.split('@')[0] || "Usuario";

  // OPTIMIZATION: Memoize computed values
  const completionPercentage = useMemo(() => metrics?.completion_percentage || 0, [metrics?.completion_percentage]);
  const rotationPercentage = useMemo(() => metrics?.rotation_percentage || 0, [metrics?.rotation_percentage]);
  const completedCount = useMemo(() => assignments.filter(a => a.status === 'completed').length, [assignments]);

  // OPTIMIZATION: Memoize loadData function with useCallback
  const loadData = useCallback(async () => {
    if (!currentMember || !homeId) return;
    
    try {
      // Use store action for assignments
      await loadAssignments(currentMember.id, homeId);
      
      // Load metrics locally (view-specific)
      const homeMetrics = await db.getHomeMetrics(homeId);
      setMetrics(homeMetrics);
    } catch (error) {
      console.error('Error loading home data:', error);
      toast.error('Error al cargar tareas');
    }
  }, [currentMember, homeId, loadAssignments]);

  // Wrapper for toggleStep with current context
  const handleToggleStep = async (stepId: number) => {
    if (!currentTaskDialog || !currentMember) return;
    await toggleStep(stepId, currentTaskDialog, currentMember.id);
  };

  // Wrapper for onLevelUpdate callback
  const handleLevelUpdate = (newLevel: MasteryLevel) => {
    onLevelUpdate?.(newLevel);
  };

  // Wrapper for completing task from dialog
  const handleCompleteTaskFromDialog = async () => {
    if (!currentMember || !homeId) return;
    await completeTaskFromDialog(currentMember.id, homeId);
    // Reload metrics after completion
    if (homeId) {
      db.getHomeMetrics(homeId).then(setMetrics).catch(console.error);
    }
  };

  // Wrapper for completing task directly
  const handleCompleteTask = async (assignmentId: number) => {
    if (!currentMember || !homeId) return;
    await completeTask(assignmentId, currentMember.id, homeId);
    // Reload metrics after completion
    if (homeId) {
      db.getHomeMetrics(homeId).then(setMetrics).catch(console.error);
    }
  };

  // Wrapper for toggle favorite
  const handleToggleFavorite = async (taskId: number) => {
    if (!currentMember) return;
    await toggleFavorite(taskId, currentMember.id);
  };

  // Wrapper for opening swap modal
  const handleOpenSwapModal = (assignment: AssignmentWithDetails) => {
    setTaskToSwap(assignment);
    setSwapModalOpen(true);
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
    <div className="flex flex-col items-center px-6 py-8 max-w-2xl mx-auto min-h-screen">
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
        {rotationPercentage >= 70 ? (
          <Badge className="bg-[#e9f5f0] text-[#6fbd9d] px-3 py-2 w-full justify-center">
            Rotacion equilibrada ({rotationPercentage}%)
          </Badge>
        ) : (
          <Badge className="bg-[#fff4e6] text-[#d97706] px-3 py-2 w-full justify-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            Alerta: Rotacion desbalanceada ({rotationPercentage}%)
          </Badge>
        )}
      </div>

      {/* SOLVER+: Available Cancelled Tasks Button */}
      {(masteryLevel === "novice" || masteryLevel === "solver" || masteryLevel === "expert" || masteryLevel === "master" || masteryLevel === "visionary") && (
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
        onClick={async () => {
          const firstPendingTask = assignments.find(a => a.status === 'pending');
          if (firstPendingTask) {
            await openTaskDialog(firstPendingTask);
            setTaskDialogOpen(true);
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
              {masteryLevel === "novice" 
                ? "Aún no tienes tareas asignadas. Usa el botón de arriba para ver las tareas disponibles."
                : "¡Excelente trabajo! Todas las tareas están completadas."}
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
                        onClick={async () => {
                          if (assignment.status !== 'completed') {
                            await openTaskDialog(assignment);
                            setTaskDialogOpen(true);
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
                      {(masteryLevel === "novice" || masteryLevel === "solver" || masteryLevel === "expert" || masteryLevel === "master" || masteryLevel === "visionary") && (
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
        onOpenChange={(open) => {
          if (!open) closeTaskDialog();
        }}
        task={currentTaskDialog}
        completedSteps={completedStepsInDialog}
        onToggleStep={handleToggleStep}
        onCompleteTask={handleCompleteTaskFromDialog}
        onClose={() => {
          closeTaskDialog();
        }}
        getTaskIcon={getTaskIcon}
        togglingStepId={togglingStepId}
      />

      {/* Swap Task Modal */}
      <SwapTaskDialog
        open={swapModalOpen}
        onOpenChange={(open) => {
          setSwapModalOpen(open);
          if (!open) setTaskToSwap(null);
        }}
        taskToSwap={taskToSwap}
        homeId={homeId || 0}
        currentMemberId={currentMember?.id || 0}
        onSuccess={async () => {
          // Reload assignments after swap request
          if (currentMember && homeId) {
            await loadAssignments(currentMember.id, homeId);
          }
          setTaskToSwap(null);
        }}
      />

      {/* Cancel Task Dialog */}
      <CancelTaskDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        assignment={taskToCancel}
        memberId={currentMember?.id || 0}
        onSuccess={async () => {
          // Reload assignments after cancellation
          if (currentMember && homeId) {
            await loadAssignments(currentMember.id, homeId);
            const homeMetrics = await db.getHomeMetrics(homeId);
            setMetrics(homeMetrics);
          }
          setTaskToCancel(null);
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
            await loadAssignments(currentMember.id, homeId);
            const homeMetrics = await db.getHomeMetrics(homeId);
            setMetrics(homeMetrics);
          }
        }}
      />
    </div>
  );
});
