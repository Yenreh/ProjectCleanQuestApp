import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { AssignmentWithDetails } from "../../lib/types";

interface CompleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: AssignmentWithDetails | null;
  completedSteps: Set<number>;
  onToggleStep: (stepId: number) => void;
  onCompleteTask: () => Promise<void>;
  onClose: () => void;
  getTaskIcon: (icon?: string) => React.ReactNode;
  togglingStepId?: number | null;
}

export function CompleteTaskDialog({
  open,
  onOpenChange,
  task,
  completedSteps,
  onToggleStep,
  onCompleteTask,
  onClose,
  getTaskIcon,
  togglingStepId,
}: CompleteTaskDialogProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  if (!task) return null;

  const requiredSteps = task.task_steps?.filter(s => !s.is_optional) || [];
  const requiredStepIds = new Set(requiredSteps.map(s => s.id));
  const completedRequired = Array.from(completedSteps).filter(id => requiredStepIds.has(id)).length;
  const allRequiredCompleted = requiredSteps.length === 0 || completedRequired === requiredSteps.length;

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onCompleteTask();
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#f5f3ed] text-[#d4a574]">
              {getTaskIcon(task.task_icon)}
            </div>
            <span>{task.task_title}</span>
          </DialogTitle>
          {task.task_zone_name && (
            <DialogDescription>
              Zona: {task.task_zone_name} • {task.task_effort} puntos
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {task.task_steps && task.task_steps.length > 0 ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Pasos a seguir:</h4>
                  <span className="text-xs text-muted-foreground">
                    {completedRequired}/{requiredSteps.length} obligatorios
                  </span>
                </div>
                <Progress 
                  value={(completedRequired / (requiredSteps.length || 1)) * 100} 
                  className="h-2 mb-4" 
                />
                
                {task.task_steps
                  .sort((a, b) => a.step_order - b.step_order)
                  .map((step) => {
                    const isCompleted = completedSteps.has(step.id);
                    const isToggling = togglingStepId === step.id;
                    return (
                      <button
                        key={step.id}
                        onClick={() => onToggleStep(step.id)}
                        disabled={isToggling || isCompleting}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          isCompleted 
                            ? 'bg-[#e9f5f0] border-2 border-[#6fbd9d]' 
                            : 'bg-[#f5f3ed] hover:bg-[#ebe9e0]'
                        } ${(isToggling || isCompleting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          {isToggling ? (
                            <Loader2 className="w-5 h-5 animate-spin text-[#d4a574] flex-shrink-0" />
                          ) : isCompleted ? (
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
                onClick={handleComplete}
                className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
                disabled={!allRequiredCompleted || isCompleting}
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completando...
                  </>
                ) : (
                  'Marcar tarea como completada'
                )}
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
                onClick={handleComplete}
                className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completando...
                  </>
                ) : (
                  'Marcar como completada'
                )}
              </Button>
            </>
          )}

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
            disabled={isCompleting}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
