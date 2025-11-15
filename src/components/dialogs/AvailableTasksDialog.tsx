import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { AlertCircle, User, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { db } from "../../lib/db";
import { toast } from "sonner";
import type { CancelledTaskWithDetails } from "../../lib/types";

interface AvailableTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeId: number;
  currentMemberId: number;
  onTaskTaken?: () => void;
}

export function AvailableTasksDialog({
  open,
  onOpenChange,
  homeId,
  currentMemberId,
  onTaskTaken,
}: AvailableTasksDialogProps) {
  const [tasks, setTasks] = useState<CancelledTaskWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [takingTaskId, setTakingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadTasks();
    }
  }, [open, homeId]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const availableTasks = await db.getAvailableCancelledTasks(homeId);
      setTasks(availableTasks);
    } catch (error) {
      console.error("Error loading available tasks:", error);
      toast.error("Error al cargar tareas disponibles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeTask = async (cancellationId: number, taskId: number, taskTitle: string) => {
    const uniqueId = cancellationId === 0 ? `unassigned-${taskId}` : `cancelled-${cancellationId}`;
    setTakingTaskId(uniqueId);

    try {
      await db.takeCancelledTask(cancellationId, currentMemberId, taskId);

      toast.success(`Has tomado la tarea: ${taskTitle}`, {
        description: "Ahora aparecerá en tu lista de tareas pendientes",
      });

      await loadTasks();

      if (onTaskTaken) {
        onTaskTaken();
      }
    } catch (error) {
      console.error("Error taking task:", error);
      toast.error("Error al tomar la tarea");
    } finally {
      setTakingTaskId(null);
    }
  };

  const getTaskIcon = (iconName: string) => {
    // Aquí puedes agregar lógica similar a HomeScreen para íconos dinámicos
    return <CheckCircle2 className="w-5 h-5" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#d4a574]" />
            <span>Tareas disponibles</span>
          </DialogTitle>
          <DialogDescription>
            Tareas canceladas por otros o nuevas sin asignar que puedes tomar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="space-y-3 mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-[#6fbd9d] animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                No hay tareas disponibles en este momento
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <Card key={task.cancellation_id === 0 ? `unassigned-${task.task_id}` : `cancelled-${task.cancellation_id}`} className="p-4">
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1">{task.task_title}</h4>
                        {task.zone_name && (
                          <Badge variant="outline" className="text-xs mb-2">
                            {task.zone_name}
                          </Badge>
                        )}
                      </div>
                      <Badge className="bg-[#fef3e0] text-[#d4a574] whitespace-nowrap">
                        {task.task_effort} pts
                      </Badge>
                      
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>Cancelada por: {task.cancelled_by_name}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Vence:{" "}
                          {new Date(task.due_date).toLocaleDateString("es-CO", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>

                      <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                        <p className="text-amber-900">
                          <strong>Motivo:</strong> {task.cancellation_reason}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        handleTakeTask(task.cancellation_id, task.task_id, task.task_title)
                      }
                      disabled={takingTaskId === (task.cancellation_id === 0 ? `unassigned-${task.task_id}` : `cancelled-${task.cancellation_id}`)}
                      className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
                      size="sm"
                    >
                      {takingTaskId === (task.cancellation_id === 0 ? `unassigned-${task.task_id}` : `cancelled-${task.cancellation_id}`) ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Tomando...
                        </>
                      ) : (
                        "Tomar esta tarea"
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
          
          {tasks.length > 0 && (
            <div className="mt-4 p-3 bg-[#f0f7ff] rounded-lg text-sm text-muted-foreground">
              <p>
                💡 Al tomar una tarea, esta se asignará a ti y desaparecerá de la lista de disponibles.
              </p>
            </div>
          )}
          </div>
        </div>

        <div className="mt-4 flex justify-center border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
