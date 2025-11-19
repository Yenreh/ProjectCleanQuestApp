import { Plus, Edit, Trash2, ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useHomeManagementStore, useUIStore } from "../../../stores";
import type { Task, Zone } from "../../../lib/types";

interface TasksManagementTabProps {
  homeId: number;
  onUpdate?: () => void;
}

export function TasksManagementTab({ homeId, onUpdate }: TasksManagementTabProps) {
  const {
    tasks,
    zones,
    isLoading,
    editingTask,
    taskName,
    taskDescription,
    taskZone,
    taskEffort,
    taskFrequency,
    taskSteps,
    setTaskName,
    setTaskDescription,
    setTaskZone,
    setTaskEffort,
    setTaskFrequency,
    setTaskSteps,
    resetTaskForm,
    startEditTask,
    saveTask,
    deleteTask,
  } = useHomeManagementStore();
  
  // UI dialog states
  const { showTaskForm, showSteps, setShowTaskForm, setShowSteps } = useUIStore();

  const handleOpenTaskForm = (task?: Task) => {
    if (task) {
      startEditTask(task);
      setShowTaskForm(true);
      // Note: startEditTask loads steps, component should call setShowSteps based on taskSteps.length
    } else {
      resetTaskForm();
      setShowTaskForm(true);
      setShowSteps(false);
    }
  };

  const handleSaveTask = async () => {
    await saveTask(homeId, () => {
      setShowTaskForm(false);
      onUpdate?.();
    });
  };

  const handleDeleteTask = async (taskId: number) => {
    await deleteTask(taskId, () => {
      onUpdate?.();
    });
  };

  const handleAddStep = () => {
    setTaskSteps([
      ...taskSteps,
      { title: "", description: "", is_optional: false, estimated_minutes: 0 }
    ]);
  };

  const handleUpdateStep = (index: number, field: string, value: any) => {
    const updated = [...taskSteps];
    updated[index] = { ...updated[index], [field]: value };
    setTaskSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    setTaskSteps(taskSteps.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {!showTaskForm ? (
        <>
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Tareas del hogar</h4>
            <Button 
              onClick={() => handleOpenTaskForm()} 
              size="sm" 
              className="bg-[#6fbd9d] hover:bg-[#5fa989]"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nueva
            </Button>
          </div>

          {tasks.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No hay tareas creadas
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {tasks.map((task) => (
                <Card key={task.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        {!task.is_active && (
                          <Badge variant="secondary" className="text-xs">Inactiva</Badge>
                        )}
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>{task.effort_points} pts</span>
                        <span>•</span>
                        <span>
                          {task.frequency === 'daily' ? 'Diaria' : 
                           task.frequency === 'weekly' ? 'Semanal' :
                           task.frequency === 'biweekly' ? 'Quincenal' : 'Mensual'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleOpenTaskForm(task)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-4">
            {editingTask ? 'Editar tarea' : 'Nueva tarea'}
          </h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-name">Nombre de la tarea</Label>
              <Input
                id="task-name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Ej: Lavar platos"
              />
            </div>

            <div>
              <Label htmlFor="task-description">Descripción (opcional)</Label>
              <Textarea
                id="task-description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Detalles adicionales..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="task-zone">Zona</Label>
              <Select value={taskZone} onValueChange={setTaskZone}>
                <SelectTrigger id="task-zone">
                  <SelectValue placeholder="Selecciona una zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin zona</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id.toString()}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="task-effort">Esfuerzo</Label>
              <Select value={taskEffort} onValueChange={setTaskEffort}>
                <SelectTrigger id="task-effort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very_low">Muy Bajo (1 pt)</SelectItem>
                  <SelectItem value="low">Bajo (3 pts)</SelectItem>
                  <SelectItem value="medium">Medio (5 pts)</SelectItem>
                  <SelectItem value="high">Alto (7 pts)</SelectItem>
                  <SelectItem value="very_high">Muy Alto (10 pts)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="task-frequency">Frecuencia</Label>
              <Select value={taskFrequency} onValueChange={setTaskFrequency}>
                <SelectTrigger id="task-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diaria</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="biweekly">Quincenal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SUBTAREAS */}
            <div className="border-t pt-4 mt-2">
              <div className="flex justify-between items-center mb-3 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSteps(!showSteps)}
                  className="p-0 h-auto font-medium hover:bg-transparent"
                >
                  {showSteps ? (
                    <ChevronUp className="w-4 h-4 mr-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 mr-1" />
                  )}
                  Subtareas ({taskSteps.length})
                </Button>
                {showSteps && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddStep}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Agregar paso
                  </Button>
                )}
              </div>

              {showSteps && (
                <div className="space-y-3 mt-3">
                  {taskSteps.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay subtareas. Agrega una para dividir esta tarea en pasos.
                    </p>
                  ) : (
                    taskSteps.map((step, index) => (
                      <Card key={index} className="p-3">
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Título del paso"
                              value={step.title}
                              onChange={(e) => handleUpdateStep(index, 'title', e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStep(index)}
                              className="h-9 w-9 p-0"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                          <Input
                            placeholder="Descripción (opcional)"
                            value={step.description}
                            onChange={(e) => handleUpdateStep(index, 'description', e.target.value)}
                          />
                          <div className="flex gap-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={step.is_optional}
                                onChange={(e) => handleUpdateStep(index, 'is_optional', e.target.checked)}
                                className="rounded"
                              />
                              Opcional
                            </label>
                            <Input
                              type="number"
                              placeholder="Minutos estimados"
                              value={step.estimated_minutes || ''}
                              onChange={(e) => handleUpdateStep(index, 'estimated_minutes', parseInt(e.target.value) || 0)}
                              className="w-32"
                            />
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSaveTask}
                disabled={isLoading || !taskName.trim()}
                className="flex-1"
              >
                {isLoading ? "Guardando..." : editingTask ? "Actualizar" : "Crear"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetTaskForm();
                  setShowTaskForm(false);
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
