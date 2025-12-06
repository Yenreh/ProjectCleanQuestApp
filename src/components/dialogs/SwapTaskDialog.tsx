import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { ArrowRightLeft, Loader2, CheckCircle2, Trash2, UtensilsCrossed, Sparkles, UserCircle } from "lucide-react";
import { db } from "../../lib/db";
import { toast } from "sonner";
import type { AssignmentWithDetails, SwappableTask } from "../../lib/types";

interface SwapTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToSwap: AssignmentWithDetails | null;
  homeId: number;
  currentMemberId: number;
  onSuccess: () => void;
}

export function SwapTaskDialog({
  open,
  onOpenChange,
  taskToSwap,
  homeId,
  currentMemberId,
  onSuccess
}: SwapTaskDialogProps) {
  const [swappableTasks, setSwappableTasks] = useState<SwappableTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequesting, setIsRequesting] = useState<number | null>(null);

  const getTaskIcon = (iconName?: string) => {
    switch (iconName) {
      case 'trash': return <Trash2 className="w-5 h-5" />;
      case 'utensils': return <UtensilsCrossed className="w-5 h-5" />;
      case 'sparkles': return <Sparkles className="w-5 h-5" />;
      default: return <CheckCircle2 className="w-5 h-5" />;
    }
  };

  // Load swappable tasks when dialog opens
  useEffect(() => {
    if (open && homeId && currentMemberId) {
      loadSwappableTasks();
    }
  }, [open, homeId, currentMemberId]);

  const loadSwappableTasks = async () => {
    setIsLoading(true);
    try {
      const tasks = await db.getSwappableTasks(homeId, currentMemberId);
      setSwappableTasks(tasks);
    } catch (error) {
      console.error('Error loading swappable tasks:', error);
      toast.error('Error al cargar tareas disponibles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapRequest = async (targetTask: SwappableTask) => {
    if (!taskToSwap) return;
    
    setIsRequesting(targetTask.id);
    try {
      await db.createSwapRequest(
        currentMemberId,
        taskToSwap.id,
        targetTask.id,
        targetTask.member_id,
        `Solicitud de intercambio: "${taskToSwap.task_title}" por "${targetTask.task_title}"`
      );
      
      toast.success('Solicitud de intercambio enviada', {
        description: `Se notificara a ${targetTask.member_name || targetTask.member_email} para que acepte o rechace`
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating swap request:', error);
      toast.error('Error al enviar solicitud de intercambio');
    } finally {
      setIsRequesting(null);
    }
  };

  // Group tasks by member
  const tasksByMember = swappableTasks.reduce((acc, task) => {
    const memberKey = task.member_email;
    if (!acc[memberKey]) {
      acc[memberKey] = {
        memberName: task.member_name || task.member_email.split('@')[0],
        memberEmail: task.member_email,
        tasks: []
      };
    }
    acc[memberKey].tasks.push(task);
    return acc;
  }, {} as Record<string, { memberName: string; memberEmail: string; tasks: SwappableTask[] }>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-[#89a7c4]" />
            <span>Intercambiar tarea</span>
          </DialogTitle>
          <DialogDescription>
            Selecciona con quien intercambiar tu tarea
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4 overflow-y-auto flex-1">
          {/* Task to swap */}
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

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-[#6fbd9d] animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Cargando tareas...</p>
            </div>
          )}

          {/* No tasks available */}
          {!isLoading && swappableTasks.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-[#6fbd9d] mx-auto mb-3" />
              <p className="text-muted-foreground">
                No hay tareas disponibles en este momento
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Los demas integrantes no tienen tareas pendientes para intercambiar
              </p>
            </div>
          )}

          {/* Tasks grouped by member */}
          {!isLoading && swappableTasks.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Tareas de otros integrantes:</p>
              
              {Object.entries(tasksByMember).map(([memberKey, memberData]) => (
                <div key={memberKey} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserCircle className="w-4 h-4" />
                    <span>{memberData.memberName}</span>
                  </div>
                  
                  {memberData.tasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => handleSwapRequest(task)}
                      disabled={isRequesting !== null}
                      className="w-full p-3 bg-white border border-border rounded-lg hover:bg-[#f5f3ed] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#f5f3ed] text-[#d4a574]">
                          {getTaskIcon(task.task_icon)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{task.task_title}</p>
                          {task.task_zone_name && (
                            <p className="text-xs text-muted-foreground">
                              {task.task_zone_name}
                            </p>
                          )}
                        </div>
                        {isRequesting === task.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#6fbd9d]" />
                        ) : (
                          <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full mt-4"
        >
          Cancelar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
