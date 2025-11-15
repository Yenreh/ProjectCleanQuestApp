import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { 
  Trash2, 
  Edit, 
  Plus, 
  Users, 
  MapPin, 
  ClipboardList, 
  Settings, 
  Loader2,
  UserPlus,
  Crown,
  Shield,
  User as UserIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { db } from "../../lib/db";
import { toast } from "sonner";
import type { Task, Zone, HomeMember, Home, MemberRole, CreateTaskInput, CreateZoneInput, TaskStep, CreateTaskStepInput } from "../../lib/types";

interface HomeManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeId: number | null;
  currentMember: HomeMember | null;
  currentHome: Home | null;
  onUpdate?: () => void;
}

export function HomeManagementDialog({ 
  open, 
  onOpenChange, 
  homeId, 
  currentMember, 
  currentHome, 
  onUpdate 
}: HomeManagementDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [members, setMembers] = useState<HomeMember[]>([]);

  // Task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskZone, setTaskZone] = useState<string>("none");
  const [taskEffort, setTaskEffort] = useState<string>("medium");
  const [taskFrequency, setTaskFrequency] = useState<string>("weekly");
  const [taskSteps, setTaskSteps] = useState<Array<{ title: string; description: string; is_optional: boolean; estimated_minutes: number }>>([]);
  const [showSteps, setShowSteps] = useState(false);

  // Zone form state
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneName, setZoneName] = useState("");

  // Member form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("member");

  // Home config state
  const [homeName, setHomeName] = useState(currentHome?.name || "");
  const [groupGoal, setGroupGoal] = useState(currentHome?.goal_percentage || 80);
  const [rotationEnabled, setRotationEnabled] = useState(currentHome?.auto_rotation || false);

  useEffect(() => {
    if (homeId && open) {
      loadData();
    }
  }, [homeId, open]);

  useEffect(() => {
    if (currentHome) {
      setHomeName(currentHome.name || "");
      setGroupGoal(currentHome.goal_percentage || 80);
      setRotationEnabled(currentHome.auto_rotation || false);
    }
  }, [currentHome]);

  const loadData = async () => {
    if (!homeId) return;
    
    setIsLoading(true);
    try {
      const [homeTasks, homeZones, homeMembers] = await Promise.all([
        db.getTasks(homeId, false),
        db.getZones(homeId),
        db.getHomeMembers(homeId)
      ]);
      
      setTasks(homeTasks);
      setZones(homeZones);
      setMembers(homeMembers);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  // Task handlers
  const handleOpenTaskForm = async (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskName(task.title);
      setTaskDescription(task.description || "");
      setTaskZone(task.zone_id ? task.zone_id.toString() : "none");
      setTaskEffort("medium");
      setTaskFrequency(task.frequency);
      
      // Cargar subtareas si existe la tarea
      try {
        const steps = await db.getTaskSteps(task.id);
        setTaskSteps(steps.map(s => ({
          title: s.title,
          description: s.description || "",
          is_optional: s.is_optional,
          estimated_minutes: s.estimated_minutes || 0
        })));
      } catch (error) {
        console.error('Error loading task steps:', error);
      }
    } else {
      setEditingTask(null);
      setTaskName("");
      setTaskDescription("");
      setTaskZone("none");
      setTaskEffort("medium");
      setTaskFrequency("weekly");
      setTaskSteps([]);
    }
    setShowTaskForm(true);
  };

  const handleCancelTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
    setTaskName("");
    setTaskDescription("");
    setTaskZone("none");
    setTaskEffort("medium");
    setTaskFrequency("weekly");
    setTaskSteps([]);
    setShowSteps(false);
  };

  const handleSaveTask = async () => {
    if (!homeId || !taskName.trim()) {
      toast.error('Completa el nombre de la tarea');
      return;
    }

    setIsLoading(true);
    try {
      const effortPoints = 
        taskEffort === "very_low" ? 1 : 
        taskEffort === "low" ? 3 : 
        taskEffort === "medium" ? 5 : 
        taskEffort === "high" ? 7 : 
        taskEffort === "very_high" ? 10 : 5;
      
      const taskData: CreateTaskInput = {
        title: taskName,
        description: taskDescription,
        zone_id: taskZone && taskZone !== "none" ? parseInt(taskZone) : undefined,
        effort_points: effortPoints,
        frequency: taskFrequency as "daily" | "weekly" | "biweekly" | "monthly",
        icon: "clipboard",
        is_active: true,
        is_template: false
      };

      if (editingTask) {
        await db.updateTask(editingTask.id, taskData);
        
        // Actualizar subtareas
        await db.deleteTaskSteps(editingTask.id);
        for (let i = 0; i < taskSteps.length; i++) {
          await db.createTaskStep(editingTask.id, {
            step_order: i + 1,
            title: taskSteps[i].title,
            description: taskSteps[i].description,
            is_optional: taskSteps[i].is_optional,
            estimated_minutes: taskSteps[i].estimated_minutes
          });
        }
        
        toast.success('Tarea actualizada');
      } else {
        const newTask = await db.createTask(homeId, taskData);
        
        // Crear subtareas
        for (let i = 0; i < taskSteps.length; i++) {
          await db.createTaskStep(newTask.id, {
            step_order: i + 1,
            title: taskSteps[i].title,
            description: taskSteps[i].description,
            is_optional: taskSteps[i].is_optional,
            estimated_minutes: taskSteps[i].estimated_minutes
          });
        }
        
        toast.success('Tarea creada');
      }

      handleCancelTaskForm();
      await loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Error al guardar tarea');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('¿Eliminar esta tarea? Se eliminará de todas las asignaciones.')) return;

    setIsLoading(true);
    try {
      await db.deleteTask(taskId);
      toast.success('Tarea eliminada');
      await loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error al eliminar tarea');
    } finally {
      setIsLoading(false);
    }
  };

  // Zone handlers
  const handleOpenZoneForm = (zone?: Zone) => {
    if (zone) {
      setEditingZone(zone);
      setZoneName(zone.name);
    } else {
      setEditingZone(null);
      setZoneName("");
    }
    setShowZoneForm(true);
  };

  const handleCancelZoneForm = () => {
    setShowZoneForm(false);
    setEditingZone(null);
    setZoneName("");
  };

  const handleSaveZone = async () => {
    if (!homeId || !zoneName.trim()) {
      toast.error('Completa el nombre de la zona');
      return;
    }

    setIsLoading(true);
    try {
      const zoneData: CreateZoneInput = {
        name: zoneName,
        icon: "map-pin"
      };

      if (editingZone) {
        await db.updateZone(editingZone.id, zoneData);
        toast.success('Zona actualizada');
      } else {
        await db.createZone(homeId, zoneData);
        toast.success('Zona creada');
      }

      handleCancelZoneForm();
      await loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error saving zone:', error);
      toast.error('Error al guardar zona');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteZone = async (zoneId: number) => {
    if (!confirm('¿Eliminar esta zona? Las tareas asociadas perderán su zona.')) return;

    setIsLoading(true);
    try {
      await db.deleteZone(zoneId);
      toast.success('Zona eliminada');
      await loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('Error al eliminar zona');
    } finally {
      setIsLoading(false);
    }
  };

  // Member handlers
  const handleOpenInviteForm = () => {
    setInviteEmail("");
    setInviteRole("member");
    setShowInviteForm(true);
  };

  const handleCancelInviteForm = () => {
    setShowInviteForm(false);
    setInviteEmail("");
    setInviteRole("member");
  };

  const handleInviteMember = async () => {
    if (!homeId || !inviteEmail.trim()) {
      toast.error('Ingresa un email válido');
      return;
    }

    setIsLoading(true);
    try {
      await db.inviteMember(homeId, { email: inviteEmail, role: inviteRole });
      toast.success('Invitación enviada');
      handleCancelInviteForm();
      await loadData();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('Error al enviar invitación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: number, newRole: MemberRole) => {
    setIsLoading(true);
    try {
      await db.updateMember(memberId, { role: newRole });
      toast.success('Rol actualizado');
      await loadData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Error al actualizar rol');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('¿Remover este miembro del hogar?')) return;

    setIsLoading(true);
    try {
      await db.removeMember(memberId);
      toast.success('Miembro removido');
      await loadData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Error al remover miembro');
    } finally {
      setIsLoading(false);
    }
  };

  // Home config handlers
  const handleSaveHomeConfig = async () => {
    if (!homeId || !homeName.trim()) {
      toast.error('El nombre del hogar es requerido');
      return;
    }

    setIsLoading(true);
    try {
      await db.updateHome(homeId, {
        name: homeName,
        goal_percentage: groupGoal,
        auto_rotation: rotationEnabled
      });
      toast.success('Configuración actualizada');
      onUpdate?.();
    } catch (error) {
      console.error('Error updating home config:', error);
      toast.error('Error al actualizar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: MemberRole) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-amber-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <UserIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const canManage = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  if (!homeId || !currentMember || !canManage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-3xl h-[95vh] overflow-y-auto overflow-x-hidden"
      >
        <DialogHeader>
          <DialogTitle>Gestión del hogar</DialogTitle>
          <DialogDescription>
            Administra tareas, zonas, miembros y configuración
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tasks" className="w-full mt-4">
          <TabsList className="w-full !grid grid-cols-4 mb-6">
            <TabsTrigger value="tasks">
              <ClipboardList className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="zones">
              <MapPin className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          {/* TASKS TAB */}
          <TabsContent value="tasks">
            <div className="space-y-3">
              {!showTaskForm ? (
                <>
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Tareas del hogar</h4>
                    <Button onClick={() => handleOpenTaskForm()} size="sm" className="bg-[#6fbd9d] hover:bg-[#5fa989]">
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
                                <span>{
                                  task.frequency === 'daily' ? 'Diaria' : 
                                  task.frequency === 'weekly' ? 'Semanal' :
                                  task.frequency === 'biweekly' ? 'Quincenal' : 'Mensual'
                                }</span>
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
                  <h4 className="text-sm font-medium mb-4">{editingTask ? 'Editar tarea' : 'Nueva tarea'}</h4>
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
                      <Select 
                        value={taskZone} 
                        onValueChange={(value: string) => {
                          setTaskZone(value);
                        }}
                      >
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
                          <span className="flex items-center gap-2">
                            <span className="text-base">{showSteps ? '−' : '+'}</span>
                            <span>Subtareas</span>
                            {taskSteps.length > 0 && (
                              <Badge variant="secondary" className="ml-1">
                                {taskSteps.length}
                              </Badge>
                            )}
                          </span>
                        </Button>
                        
                        {showSteps && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setTaskSteps([...taskSteps, { title: "", description: "", is_optional: false, estimated_minutes: 0 }])}
                            className="shrink-0"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Añadir
                          </Button>
                        )}
                      </div>

                      {showSteps && (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto overflow-x-hidden">
                          {taskSteps.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                              <p>No hay subtareas aún</p>
                              <p className="text-xs mt-1">Haz clic en "Añadir" para crear una</p>
                            </div>
                          ) : (
                            taskSteps.map((step, index) => (
                              <div key={index} className="border rounded-lg p-3 bg-muted/10 space-y-3">
                                {/* Header con número y botón eliminar */}
                                <div className="flex items-start gap-2">
                                  <Badge variant="outline" className="mt-1 shrink-0">
                                    {index + 1}
                                  </Badge>
                                  <Input
                                    placeholder={`Título del paso ${index + 1}`}
                                    value={step.title}
                                    onChange={(e) => {
                                      const newSteps = [...taskSteps];
                                      newSteps[index].title = e.target.value;
                                      setTaskSteps(newSteps);
                                    }}
                                    className="flex-1 min-w-0"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 w-9 p-0 shrink-0"
                                    onClick={() => {
                                      const newSteps = taskSteps.filter((_, i) => i !== index);
                                      setTaskSteps(newSteps);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                                
                                {/* Descripción */}
                                <Textarea
                                  placeholder="Descripción (opcional)"
                                  value={step.description}
                                  onChange={(e) => {
                                    const newSteps = [...taskSteps];
                                    newSteps[index].description = e.target.value;
                                    setTaskSteps(newSteps);
                                  }}
                                  rows={2}
                                  className="resize-none"
                                />

                                {/* Opciones en una fila */}
                                <div className="flex items-center gap-4 text-sm flex-wrap">
                                  <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={step.is_optional}
                                      onChange={(e) => {
                                        const newSteps = [...taskSteps];
                                        newSteps[index].is_optional = e.target.checked;
                                        setTaskSteps(newSteps);
                                      }}
                                      className="rounded w-4 h-4"
                                    />
                                    <span>Opcional</span>
                                  </label>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Duración:</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      placeholder="0"
                                      value={step.estimated_minutes || ""}
                                      onChange={(e) => {
                                        const newSteps = [...taskSteps];
                                        newSteps[index].estimated_minutes = parseInt(e.target.value) || 0;
                                        setTaskSteps(newSteps);
                                      }}
                                      className="w-16 h-8"
                                    />
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">min</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelTaskForm}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveTask}
                        disabled={isLoading}
                        className="flex-1 bg-[#6fbd9d] hover:bg-[#5fa989]"
                      >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingTask ? 'Actualizar' : 'Crear'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ZONES TAB */}
          <TabsContent value="zones">
            <div className="space-y-3">
              {!showZoneForm ? (
                <>
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Zonas del hogar</h4>
                    <Button onClick={() => handleOpenZoneForm()} size="sm" className="bg-[#6fbd9d] hover:bg-[#5fa989]">
                      <Plus className="w-4 h-4 mr-1" />
                      Nueva
                    </Button>
                  </div>

                  {zones.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No hay zonas creadas
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {zones.map((zone) => (
                        <Card key={zone.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{zone.name}</p>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleOpenZoneForm(zone)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDeleteZone(zone.id)}
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
                  <h4 className="text-sm font-medium mb-4">{editingZone ? 'Editar zona' : 'Nueva zona'}</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="zone-name">Nombre de la zona</Label>
                      <Input
                        id="zone-name"
                        value={zoneName}
                        onChange={(e) => setZoneName(e.target.value)}
                        placeholder="Ej: Cocina, Baño, Sala..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelZoneForm}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveZone}
                        disabled={isLoading}
                        className="flex-1 bg-[#6fbd9d] hover:bg-[#5fa989]"
                      >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingZone ? 'Actualizar' : 'Crear'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* MEMBERS TAB */}
          <TabsContent value="members">
            <div className="space-y-3">
              {!showInviteForm ? (
                <>
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Miembros</h4>
                    <Button onClick={handleOpenInviteForm} size="sm" className="bg-[#6fbd9d] hover:bg-[#5fa989]">
                      <UserPlus className="w-4 h-4 mr-1" />
                      Invitar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {members.map((member) => (
                      <Card key={member.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(member.role)}
                            <div>
                              <p className="text-sm font-medium">{member.full_name || member.email}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          {currentMember.role === 'owner' && member.id !== currentMember.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <Card className="p-4">
                  <h4 className="text-sm font-medium mb-4">Invitar miembro</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="invite-email">Email</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="invite-role">Rol</Label>
                      <Select value={inviteRole} onValueChange={(value: string) => setInviteRole(value as MemberRole)}>
                        <SelectTrigger id="invite-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Miembro</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelInviteForm}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleInviteMember}
                        disabled={isLoading}
                        className="flex-1 bg-[#6fbd9d] hover:bg-[#5fa989]"
                      >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Invitar
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* CONFIG TAB */}
          <TabsContent value="config">
            <div className="space-y-4">
              <div>
                <Label htmlFor="home-name" className="text-sm">Nombre del hogar</Label>
                <Input
                  id="home-name"
                  value={homeName}
                  onChange={(e) => setHomeName(e.target.value)}
                  placeholder="Mi Casa"
                />
              </div>
              
              <div>
                <Label htmlFor="group-goal" className="text-sm">Meta grupal (%)</Label>
                <Input
                  id="group-goal"
                  type="number"
                  min="0"
                  max="100"
                  value={groupGoal}
                  onChange={(e) => setGroupGoal(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Rotación automática</p>
                  <p className="text-xs text-muted-foreground">Asignar tareas cada semana</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rotationEnabled}
                    onChange={(e) => setRotationEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6fbd9d]"></div>
                </label>
              </div>

              <Button 
                onClick={handleSaveHomeConfig} 
                disabled={isLoading}
                className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar configuración
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full mt-4"
        >
          Cerrar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
