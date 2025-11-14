import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { CheckCircle2, Trash2, UtensilsCrossed, Sparkles, Circle, Lightbulb, AlertCircle, Calculator, ChevronDown, ChevronUp, GripVertical, TrendingUp, Heart, Loader2, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { db } from "../lib/db";
import { toast } from "sonner";
import type { AssignmentWithDetails, HomeMember, HomeMetrics } from "../lib/types";

type MasteryLevel = "novice" | "solver" | "expert" | "master" | "visionary";

interface HomeScreenProps {
  masteryLevel: MasteryLevel;
  currentMember?: HomeMember | null;
  homeId?: number | null;
}

export function HomeScreen({ masteryLevel, currentMember, homeId }: HomeScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [metrics, setMetrics] = useState<HomeMetrics | null>(null);
  const [showCalculation, setShowCalculation] = useState(false);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [reassignTarget, setReassignTarget] = useState<number | null>(null);
  const [quickProposal, setQuickProposal] = useState("");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [currentTaskDialog, setCurrentTaskDialog] = useState<AssignmentWithDetails | null>(null);
  const [completedStepsInDialog, setCompletedStepsInDialog] = useState<Set<number>>(new Set());
  
  const userName = currentMember?.email?.split('@')[0] || "Usuario";

  // Load tasks and metrics
  useEffect(() => {
    if (currentMember && homeId) {
      loadData();
    }
  }, [currentMember, homeId]);

  const loadData = async () => {
    if (!currentMember || !homeId) return;
    
    setIsLoading(true);
    try {
      const [myAssignments, homeMetrics] = await Promise.all([
        db.getMyAssignments(currentMember.id, 'pending'),
        db.getHomeMetrics(homeId)
      ]);
      
      setAssignments(myAssignments);
      setMetrics(homeMetrics);
    } catch (error) {
      console.error('Error loading home data:', error);
      toast.error('Error al cargar tareas');
    } finally {
      setIsLoading(false);
    }
  };

  const openTaskDialog = async (assignment: AssignmentWithDetails) => {
    console.log('Opening task dialog for:', assignment.task_title);
    setCurrentTaskDialog(assignment);
    
    // Load completed steps for this assignment
    if (assignment.task_steps && assignment.task_steps.length > 0) {
      try {
        const completions = await db.getStepCompletions(assignment.id);
        const completedStepIds = new Set(completions.map(c => c.step_id));
        setCompletedStepsInDialog(completedStepIds);
      } catch (error) {
        console.error('Error loading step completions:', error);
      }
    }
    
    setTaskDialogOpen(true);
    console.log('Dialog state set to true');
  };

  const handleToggleStep = async (stepId: number) => {
    if (!currentTaskDialog || !currentMember) return;

    const isCompleted = completedStepsInDialog.has(stepId);
    
    try {
      if (isCompleted) {
        // Currently we don't have an uncomplete step function, so just update UI
        toast.info('Marcar pasos como no completados próximamente');
        return;
      } else {
        await db.completeTaskStep(stepId, currentTaskDialog.id, currentMember.id);
        setCompletedStepsInDialog(prev => new Set([...prev, stepId]));
        toast.success('Paso completado');
      }
    } catch (error) {
      console.error('Error toggling step:', error);
      toast.error('Error al actualizar paso');
    }
  };

  const handleCompleteTaskFromDialog = async () => {
    if (!currentTaskDialog || !currentMember) return;

    const totalSteps = currentTaskDialog.task_steps?.length || 0;
    const completedSteps = completedStepsInDialog.size;

    if (totalSteps > 0 && completedSteps < totalSteps) {
      toast.error(`Completa todos los pasos (${completedSteps}/${totalSteps})`);
      return;
    }

    try {
      await db.completeTask(currentTaskDialog.id, currentMember.id);
      toast.success('¡Tarea completada!');
      setTaskDialogOpen(false);
      setCurrentTaskDialog(null);
      setCompletedStepsInDialog(new Set());
      await loadData();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Error al completar tarea');
    }
  };

  const handleCompleteTask = async (assignmentId: number) => {
    if (!currentMember) return;
    
    try {
      await db.completeTask(assignmentId, currentMember.id);
      toast.success('¡Tarea completada!');
      await loadData();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Error al completar tarea');
    }
  };

  const handleRequestReassignment = async () => {
    if (!selectedTask || !reassignTarget) {
      toast.error('Selecciona una tarea y un compañero');
      return;
    }

    try {
      await db.requestTaskExchange(currentMember!.id, selectedTask, 'swap', reassignTarget);
      toast.success('Solicitud de intercambio enviada');
      setSelectedTask(null);
      setReassignTarget(null);
    } catch (error) {
      console.error('Error requesting reassignment:', error);
      toast.error('Error al solicitar reasignación');
    }
  };

  const handleQuickProposal = async () => {
    if (!quickProposal.trim() || !homeId || !currentMember) {
      toast.error('Escribe una idea primero');
      return;
    }

    try {
      await db.createProposal(homeId, currentMember.id, {
        title: quickProposal,
        hypothesis: 'Propuesta rápida desde la vista principal',
        status: 'pending',
        votes_yes: 0,
        votes_no: 0
      });
      toast.success('Propuesta enviada a votación');
      setQuickProposal('');
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Error al enviar propuesta');
    }
  };

  const completionPercentage = metrics?.completion_percentage || 0;
  const rotationPercentage = metrics?.rotation_percentage || 0;
  const completedCount = assignments.filter(a => a.status === 'completed').length;

  // Simulate what-if for expert level
  const whatIfCompletion = selectedTask ? 85 : completionPercentage;
  const whatIfRotation = selectedTask ? 22 : rotationPercentage;

  // Helper to get icon for task
  const getTaskIcon = (iconName?: string) => {
    switch (iconName) {
      case 'trash': return <Trash2 className="w-5 h-5" />;
      case 'utensils': return <UtensilsCrossed className="w-5 h-5" />;
      case 'sparkles': return <Sparkles className="w-5 h-5" />;
      default: return <CheckCircle2 className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#6fbd9d] animate-spin mb-4" />
        <p className="text-muted-foreground">Cargando tareas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 py-8 max-w-md mx-auto h-full">
      {/* Header */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1>¡Bienvenido, {userName}!</h1>
          <Badge className="bg-[#e9f5f0] text-[#6fbd9d]">
            {masteryLevel === "novice" && "Novato"}
            {masteryLevel === "solver" && "Solucionador"}
            {masteryLevel === "expert" && "Experto"}
            {masteryLevel === "master" && "Maestro"}
            {masteryLevel === "visionary" && "Visionario"}
          </Badge>
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

      {/* SOLVER+: How It's Calculated */}
      {(masteryLevel === "solver" || masteryLevel === "expert" || masteryLevel === "master" || masteryLevel === "visionary") && (
        <Card className="p-4 mb-4 w-full bg-white">
          <Collapsible open={showCalculation} onOpenChange={setShowCalculation}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#89a7c4]" />
                  <h4>¿Cómo se calcula el %?</h4>
                </div>
                {showCalculation ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              <div className="p-3 bg-[#f5f3ed] rounded-lg">
                <p className="text-sm mb-2">Fórmula:</p>
                <code className="text-xs bg-white px-2 py-1 rounded block">
                  % = (Puntos ganados / Puntos posibles) × 100
                </code>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completadas:</span>
                  <span>7 tareas (18 puntos)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asignadas:</span>
                  <span>9 tareas (23 puntos)</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between">
                  <span>Resultado:</span>
                  <span className="text-[#6fbd9d]">18 / 23 = 78%</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* EXPERT+: What-If Impact Panel */}
      {(masteryLevel === "expert" || masteryLevel === "master" || masteryLevel === "visionary") && selectedTask && (
        <Card className="p-4 mb-4 w-full bg-[#f0f7ff]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-[#89a7c4]" />
            <h4>Impacto si reasignas</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-white rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Completitud</p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{whatIfCompletion}%</span>
                <span className={`text-xs ${whatIfCompletion > completionPercentage ? 'text-green-500' : 'text-red-500'}`}>
                  +{whatIfCompletion - completionPercentage}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Rotación</p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{whatIfRotation}%</span>
                <span className={`text-xs ${whatIfRotation < rotationPercentage ? 'text-green-500' : 'text-red-500'}`}>
                  {whatIfRotation - rotationPercentage}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1 bg-[#89a7c4] hover:bg-[#7496b0]"
              onClick={handleRequestReassignment}
            >
              Solicitar reasignación
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setSelectedTask(null)}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* MASTER+: Quick Controls */}
      {(masteryLevel === "master" || masteryLevel === "visionary") && (
        <Card className="p-4 mb-4 w-full bg-white">
          <h4 className="mb-3">Controles rápidos</h4>
          <div className="space-y-2">
            <button 
              onClick={() => toast.info('Configuración de meta grupal próximamente')}
              className="w-full flex items-center justify-between p-2 bg-[#f5f3ed] rounded hover:bg-[#ebe9e0] transition-colors"
            >
              <span className="text-sm">Meta grupal:</span>
              <Badge variant="outline">80%</Badge>
            </button>
            <button 
              onClick={() => toast.info('Configuración de rotación próximamente')}
              className="w-full flex items-center justify-between p-2 bg-[#f5f3ed] rounded hover:bg-[#ebe9e0] transition-colors"
            >
              <span className="text-sm">Rotación:</span>
              <Badge variant="outline">Semanal</Badge>
            </button>
            <button 
              onClick={() => toast.info('Configuración de recordatorios próximamente')}
              className="w-full flex items-center justify-between p-2 bg-[#f5f3ed] rounded hover:bg-[#ebe9e0] transition-colors"
            >
              <span className="text-sm">Recordatorios:</span>
              <Badge className="bg-[#6fbd9d]">09:00</Badge>
            </button>
          </div>
        </Card>
      )}

      {/* VISIONARY: Quick Proposal */}
      {masteryLevel === "visionary" && (
        <Card className="p-4 mb-4 w-full bg-[#fef3e0]">
          <h4 className="mb-2">💡 Propuesta rápida</h4>
          <Input 
            placeholder="Nueva idea de mejora..." 
            className="mb-2 text-sm"
            value={quickProposal}
            onChange={(e) => setQuickProposal(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleQuickProposal()}
          />
          <Button 
            size="sm" 
            className="w-full bg-[#d4a574] hover:bg-[#c49565]"
            onClick={handleQuickProposal}
          >
            Enviar a votación
          </Button>
        </Card>
      )}

      {/* Main Action Button */}
      <Button 
        size="lg" 
        className="w-full mb-6 h-14 bg-[#6fbd9d] hover:bg-[#5fa989]"
        onClick={() => {
          const nextTask = assignments.find(a => a.status === 'pending');
          if (nextTask) {
            handleCompleteTask(nextTask.id);
          } else {
            toast.info('No hay tareas pendientes');
          }
        }}
      >
        {masteryLevel === "visionary" ? "Iniciar experimento de hoy" : "Cumplir tarea de hoy"}
      </Button>

      {/* Tasks List */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3>
            {masteryLevel === "novice" && "Checklist de mi semana"}
            {masteryLevel !== "novice" && "Tareas pendientes"}
          </h3>
          {masteryLevel === "novice" && (
            <span className="text-sm text-muted-foreground">{completedCount}/{assignments.length}</span>
          )}
        </div>
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <Card 
              key={assignment.id} 
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                (masteryLevel === "expert" || masteryLevel === "master" || masteryLevel === "visionary") ? "cursor-move" : ""
              } ${selectedTask === assignment.id ? "ring-2 ring-[#6fbd9d] shadow-md" : ""}`}
              draggable={masteryLevel === "expert" || masteryLevel === "master" || masteryLevel === "visionary"}
              onDragStart={() => (masteryLevel === "expert" || masteryLevel === "master" || masteryLevel === "visionary") && setSelectedTask(assignment.id)}
              onClick={() => {
                if (assignment.status !== 'completed') {
                  openTaskDialog(assignment);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {(masteryLevel === "expert" || masteryLevel === "master" || masteryLevel === "visionary") && (
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div className={`p-2 rounded-lg ${assignment.status === 'completed' ? 'bg-[#e9f5f0] text-[#6fbd9d]' : 'bg-[#f5f3ed] text-[#d4a574]'}`}>
                    {getTaskIcon(assignment.task_icon)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={assignment.status === 'completed' ? 'text-muted-foreground line-through' : ''}>
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
                          {new Date(assignment.assigned_date).toLocaleDateString('es-ES', { weekday: 'short' })}
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
                      {masteryLevel === "novice" && (
                        <Circle className="w-5 h-5 text-[#d4a574]" />
                      )}
                      {(masteryLevel === "expert" || masteryLevel === "master" || masteryLevel === "visionary") && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            toast.info('Marcar como favorito próximamente');
                          }}
                        >
                          <Heart className="w-3 h-3" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* NOVICE: Contextual Tips */}
      {masteryLevel === "novice" && (
        <Card className="p-4 mt-4 w-full bg-[#f0f7ff]">
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

      {/* NOVICE: Alternative Path Button */}
      {masteryLevel === "novice" && (
        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={() => toast.info('Funcionalidad próximamente - Podrás explorar diferentes estrategias')}
        >
          Probar otro camino
        </Button>
      )}

      {/* Task Details Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-w-md">
          {currentTaskDialog ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#f5f3ed] text-[#d4a574]">
                    {getTaskIcon(currentTaskDialog.task_icon)}
                  </div>
                  <span>{currentTaskDialog.task_title}</span>
                </DialogTitle>
                {currentTaskDialog.task_zone_name && (
                  <DialogDescription>
                    Zona: {currentTaskDialog.task_zone_name} • {currentTaskDialog.task_effort} puntos
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {currentTaskDialog.task_steps && currentTaskDialog.task_steps.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Pasos a seguir:</h4>
                        <span className="text-xs text-muted-foreground">
                          {completedStepsInDialog.size}/{currentTaskDialog.task_steps.length}
                        </span>
                      </div>
                      <Progress 
                        value={(completedStepsInDialog.size / currentTaskDialog.task_steps.length) * 100} 
                        className="h-2 mb-4" 
                      />
                      
                      {currentTaskDialog.task_steps
                        .sort((a, b) => a.step_order - b.step_order)
                        .map((step) => {
                          const isCompleted = completedStepsInDialog.has(step.id);
                          return (
                            <button
                              key={step.id}
                              onClick={() => handleToggleStep(step.id)}
                              className={`w-full p-3 rounded-lg text-left transition-all ${
                                isCompleted 
                                  ? 'bg-[#e9f5f0] border-2 border-[#6fbd9d]' 
                                  : 'bg-[#f5f3ed] hover:bg-[#ebe9e0]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-[#6fbd9d] flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-[#d4a574] flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                  <span className={`text-sm ${isCompleted ? 'text-[#5fa989] line-through' : ''}`}>
                                    {step.step_order}. {step.title}
                                  </span>
                                  {step.is_optional && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Opcional
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                    </div>

                    <Button
                      onClick={handleCompleteTaskFromDialog}
                      className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
                      disabled={completedStepsInDialog.size < currentTaskDialog.task_steps.length}
                    >
                      Marcar tarea como completada
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-[#f5f3ed] rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        Esta tarea no tiene pasos definidos
                      </p>
                    </div>
                    <Button
                      onClick={handleCompleteTaskFromDialog}
                      className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
                    >
                      Marcar como completada
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setTaskDialogOpen(false);
                    setCurrentTaskDialog(null);
                    setCompletedStepsInDialog(new Set());
                  }}
                  className="w-full"
                >
                  Cerrar
                </Button>
              </div>
            </>
          ) : (
            <div className="p-4">
              <p>Cargando...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
