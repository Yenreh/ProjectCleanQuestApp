import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Home, Users, ListTodo, Sparkles, CheckCircle2, Clock, Mail, Link2, Trash2, UtensilsCrossed, Droplet, BedDouble, X } from "lucide-react";
import { toast } from "sonner";
import { db } from "../lib/db";

interface OnboardingWizardProps {
  onComplete: () => void;
}

type Step = "create-home" | "add-roommates" | "add-tasks" | "first-task";

interface TaskTemplate {
  id: number;
  name: string;
  title: string;
  icon: string;
  zone: string;
  frequency: string;
  effort_points: number;
  steps: Array<{ step_order: number; title: string; is_optional: boolean }>;
}

// Icon mapping
const iconMap: Record<string, any> = {
  'trash': Trash2,
  'utensils': UtensilsCrossed,
  'sparkles': Sparkles,
  'droplet': Droplet,
  'bed': BedDouble,
};

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("create-home");
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
  
  // Step A: Create Home
  const [homeName, setHomeName] = useState("");
  const [memberCount, setMemberCount] = useState("2");
  const [selectedZones, setSelectedZones] = useState<string[]>(["cocina", "sala", "baño"]);
  const [reminderTime, setReminderTime] = useState("09:00");

  // Step B: Roommates
  const [roommates, setRoommates] = useState<Array<{ email: string; role: string; status: string }>>([]);
  const [newEmail, setNewEmail] = useState("");

  // Step C: Tasks - Load from database
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);

  // Zones - Load from database
  const [zones, setZones] = useState<string[]>([]);

  // Persisted home id after backend creation
  const [createdHomeId, setCreatedHomeId] = useState<number | null>(null);

  // Step D: First task
  const [firstTaskProgress, setFirstTaskProgress] = useState(0);

  // Load zone presets from database
  useEffect(() => {
    const loadZones = async () => {
      try {
        const zonePresets = await db.getZonePresets();
        setZones(zonePresets);
      } catch (error) {
        console.error('Error loading zone presets:', error);
        // Fallback to hardcoded zones
        setZones(["cocina", "sala", "baño", "habitaciones", "entrada"]);
      }
    };
    
    loadZones();
  }, []);

  // Load task templates from database
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templates = await db.getTaskTemplatesWithSteps(true);
        setTaskTemplates(templates as TaskTemplate[]);
      } catch (error) {
        console.error('Error loading task templates:', error);
        toast.error('Error al cargar plantillas de tareas');
      }
    };
    
    loadTemplates();
  }, []);

  const handleCreateHome = () => {
    if (!homeName.trim()) {
      toast.error("Por favor ingresa el nombre de tu casa");
      return;
    }

    // Try to persist the home in backend
    (async () => {
      try {
        const user = await db.getCurrentUser();
        if (!user) {
          // No user authenticated - show error
          toast.error('Usuario no autenticado');
          return;
        }

        const homeInput = {
          name: homeName,
          member_count: parseInt(memberCount, 10) || 2,
          goal_percentage: 80,
          rotation_policy: 'weekly',
          auto_rotation: true,
          reminder_time: reminderTime
        } as any;

        const created = await db.createHome(user.id, homeInput);
        setCreatedHomeId(created.id);

        // Create selected zones in backend
        for (const zone of selectedZones) {
          try {
            await db.createZone(created.id, { name: zone, icon: zone });
          } catch (zErr) {
            // non-fatal
            console.warn('Zone create error', zErr);
          }
        }

        setCompletedSteps(prev => new Set([...prev, "create-home"]));
        toast.success("¡Casa creada, bienvenido! 🏡");
        setCurrentStep("add-tasks");
      } catch (error) {
        console.error('Error creando casa:', error);
        toast.error('Error al crear la casa. Intenta de nuevo.');
      }
    })();
  };

  const handleToggleZone = (zone: string) => {
    setSelectedZones(prev =>
      prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
    );
  };

  const handleAddRoommate = () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      toast.error("Por favor ingresa un correo válido");
      return;
    }
    setRoommates(prev => [...prev, { email: newEmail, role: "Miembro", status: "Pendiente" }]);
    setNewEmail("");
    toast.success("Invitación enviada");
  };

  const handleResendInvite = (email: string) => {
    toast.success(`Invitación reenviada a ${email}`);
  };

  const handleCompleteRoommates = () => {
    setCompletedSteps(prev => new Set([...prev, "add-roommates"]));
    if (!completedSteps.has("add-tasks")) {
      setCurrentStep("add-tasks");
    } else {
      setCurrentStep("first-task");
    }
  };

  const handleToggleTask = (taskId: number) => {
    setSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleCompleteTasks = () => {
    if (selectedTasks.length === 0) {
      toast.error("Agrega al menos una tarea");
      return;
    }

    (async () => {
      try {
        if (!createdHomeId) {
          toast.error('Primero crea la casa para poder agregar tareas');
          return;
        }

        // Create tasks in backend for each selected task id
        for (const tId of selectedTasks) {
          const template = taskTemplates.find(t => t.id === tId);
          if (!template) continue;
          
          const freqMap: any = { daily: 'daily', weekly: 'weekly', diario: 'daily', semanal: 'weekly' };
          const frequency = (freqMap as any)[template.frequency] || 'weekly';
          
          // Find zone_id for this task
          const zones = await db.getZones(createdHomeId);
          const matchingZone = zones.find(z => z.name === template.zone);
          
          // Persist a global task template (catalog) and also create the home task
          try {
            await db.createTaskTemplate({
              name: template.name,
              title: template.title,
              description: '',
              icon: template.icon,
              zone: template.zone,
              frequency: frequency as any,
              effort_points: template.effort_points
            } as any);
          } catch (tplErr) {
            // ignore duplicate or other non-fatal errors
            console.warn('Task template create error', tplErr);
          }

          // Create task instance for this home with zone_id
          const createdTask = await db.createTask(createdHomeId, {
            title: template.title,
            description: '',
            icon: template.icon,
            zone_id: matchingZone?.id,
            frequency,
            effort_points: template.effort_points,
            is_active: true,
            is_template: true
          } as any);

          // Create steps for this task
          if (template.steps && createdTask) {
            for (const step of template.steps) {
              try {
                await db.createTaskStep(createdTask.id, {
                  step_order: step.step_order,
                  title: step.title,
                  description: null,
                  is_optional: step.is_optional,
                  estimated_minutes: null
                } as any);
              } catch (stepErr) {
                console.warn('Task step create error', stepErr);
              }
            }
          }
        }

        // Trigger rotation / assignment after creating tasks
        try {
          await db.autoAssignTasks(createdHomeId, new Date());
        } catch (assignErr) {
          console.warn('Auto-assign failed:', assignErr);
        }

        setCompletedSteps(prev => new Set([...prev, "add-tasks"]));
        toast.success("¡Tareas agregadas con rotación automática! 🔄");
        setCurrentStep("first-task");
      } catch (error) {
        console.error('Error creando tareas:', error);
        toast.error('Error al guardar tareas. Intenta de nuevo.');
      }
    })();
  };

  const handleFirstTaskAction = () => {
    if (firstTaskProgress === 0) {
      setFirstTaskProgress(50);
      toast.success("¡Bien hecho! 🎉 Sigue así");
    } else if (firstTaskProgress === 50) {
      setFirstTaskProgress(100);
      toast.success("¡Tarea completada! 🌟");
      
      // Mark onboarding as complete
      (async () => {
        try {
          const user = await db.getCurrentUser();
          if (user) {
            await db.markOnboardingComplete(user.id);
          }
          
          setTimeout(() => {
            setCompletedSteps(prev => new Set([...prev, "first-task"]));
            onComplete();
          }, 1500);
        } catch (error) {
          console.error('Error marking onboarding complete:', error);
          // Still complete the wizard even if DB update fails
          setTimeout(() => {
            setCompletedSteps(prev => new Set([...prev, "first-task"]));
            onComplete();
          }, 1500);
        }
      })();
    }
  };

  const getProgressPercentage = () => {
    return (completedSteps.size / 4) * 100;
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] px-6 py-8 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-[#6fbd9d]" />
          <h1 className="text-2xl font-bold">CleanQuest</h1>
        </div>
        <p className="text-muted-foreground text-base mb-6">Configura tu hogar colaborativo</p>
        
        {/* Progress Bar */}
        <Progress value={getProgressPercentage()} className="h-2 mb-6" />
        
        {/* Step Icons */}
        <div className="flex items-center justify-around">
          <div 
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => setCurrentStep("create-home")}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentStep === "create-home" 
                ? "bg-[#6fbd9d] shadow-lg" 
                : completedSteps.has("create-home")
                ? "bg-[#6fbd9d]"
                : "bg-gray-200"
            }`}>
              {completedSteps.has("create-home") ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <Home className={`w-6 h-6 ${currentStep === "create-home" || completedSteps.has("create-home") ? "text-white" : "text-gray-400"}`} />
              )}
            </div>
            <span className={`text-sm font-medium ${currentStep === "create-home" || completedSteps.has("create-home") ? "text-[#6fbd9d]" : "text-gray-400"}`}>
              Casa
            </span>
          </div>

          <div 
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => completedSteps.has("create-home") && setCurrentStep("add-roommates")}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentStep === "add-roommates" 
                ? "bg-[#6fbd9d] shadow-lg" 
                : completedSteps.has("add-roommates")
                ? "bg-[#6fbd9d]"
                : "bg-gray-200"
            }`}>
              {completedSteps.has("add-roommates") ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <Users className={`w-6 h-6 ${currentStep === "add-roommates" || completedSteps.has("add-roommates") ? "text-white" : "text-gray-400"}`} />
              )}
            </div>
            <span className={`text-sm font-medium ${currentStep === "add-roommates" || completedSteps.has("add-roommates") ? "text-[#6fbd9d]" : "text-gray-400"}`}>
              Roomies
            </span>
          </div>

          <div 
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => completedSteps.has("add-roommates") && setCurrentStep("add-tasks")}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentStep === "add-tasks" 
                ? "bg-[#6fbd9d] shadow-lg" 
                : completedSteps.has("add-tasks")
                ? "bg-[#6fbd9d]"
                : "bg-gray-200"
            }`}>
              {completedSteps.has("add-tasks") ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <ListTodo className={`w-6 h-6 ${currentStep === "add-tasks" || completedSteps.has("add-tasks") ? "text-white" : "text-gray-400"}`} />
              )}
            </div>
            <span className={`text-sm font-medium ${currentStep === "add-tasks" || completedSteps.has("add-tasks") ? "text-[#6fbd9d]" : "text-gray-400"}`}>
              Tareas
            </span>
          </div>

          <div 
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => completedSteps.has("add-tasks") && setCurrentStep("first-task")}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentStep === "first-task" 
                ? "bg-[#6fbd9d] shadow-lg" 
                : completedSteps.has("first-task")
                ? "bg-[#6fbd9d]"
                : "bg-gray-200"
            }`}>
              {completedSteps.has("first-task") ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <Sparkles className={`w-6 h-6 ${currentStep === "first-task" || completedSteps.has("first-task") ? "text-white" : "text-gray-400"}`} />
              )}
            </div>
            <span className={`text-sm font-medium ${currentStep === "first-task" || completedSteps.has("first-task") ? "text-[#6fbd9d]" : "text-gray-400"}`}>
              Tutorial
            </span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {/* Step A: Create Home */}
        {currentStep === "create-home" && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-[#6fbd9d]" />
              <h3>Crea tu casa</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Nombre del hogar</Label>
                <Input
                  placeholder="Casa de Ana y roomies"
                  value={homeName}
                  onChange={(e) => setHomeName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Número de integrantes</Label>
                <Select value={memberCount} onValueChange={setMemberCount}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={String(num)}>{num} personas</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Zonas del hogar</Label>
                <div className="flex flex-wrap gap-2">
                  {zones.map(zone => (
                    <Badge
                      key={zone}
                      variant={selectedZones.includes(zone) ? "default" : "outline"}
                      className={`cursor-pointer ${
                        selectedZones.includes(zone) ? "bg-[#6fbd9d] hover:bg-[#5fa989]" : ""
                      }`}
                      onClick={() => handleToggleZone(zone)}
                    >
                      {zone}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Recordatorio diario</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateHome}
                className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
              >
                Crear casa
              </Button>
            </div>
          </Card>
        )}

        {/* Step B: Add Roommates */}
        {currentStep === "add-roommates" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#89a7c4]" />
                <h3>Agrega a tus roomies</h3>
              </div>
              <Badge variant="outline">Opcional</Badge>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Invitar por correo</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddRoommate()}
                  />
                  <Button onClick={handleAddRoommate} variant="outline">
                    <Mail className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Invitaciones enviadas</Label>
                {roommates.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Aún no has invitado a nadie
                  </p>
                ) : (
                  roommates.map((roommate, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#f5f3ed] rounded-lg">
                      <div>
                        <p className="text-sm">{roommate.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{roommate.role}</Badge>
                          <span className="text-xs text-muted-foreground">{roommate.status}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResendInvite(roommate.email)}
                      >
                        <Link2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCompleteRoommates}
                  variant="outline"
                  className="flex-1"
                >
                  Omitir por ahora
                </Button>
                <Button
                  onClick={handleCompleteRoommates}
                  className="flex-1 bg-[#89a7c4] hover:bg-[#7496b0]"
                >
                  Continuar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step C: Add Tasks */}
        {currentStep === "add-tasks" && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ListTodo className="w-5 h-5 text-[#d4a574]" />
              <h3>Agrega tareas del hogar</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Plantillas rápidas</Label>
                <div className="space-y-2">
                  {taskTemplates.map((template) => {
                    const IconComponent = iconMap[template.icon] || Sparkles;
                    return (
                      <div
                        key={template.id}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedTasks.includes(template.id)
                            ? "bg-[#e9f5f0] ring-1 ring-[#6fbd9d]"
                            : "bg-[#f5f3ed] hover:bg-[#ebe9e0]"
                        }`}
                        onClick={() => handleToggleTask(template.id)}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-5 h-5 text-[#d4a574]" />
                          <div>
                            <p className="text-sm">{template.title}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{template.zone}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{template.frequency}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">Esfuerzo: {template.effort_points}</span>
                            </div>
                          </div>
                        </div>
                        <Checkbox checked={selectedTasks.includes(template.id)} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#e9f5f0] p-3 rounded-lg">
                <p className="text-sm text-[#5fa989]">
                  ✓ Rotación automática activada para todas las tareas
                </p>
              </div>

              <Button
                onClick={handleCompleteTasks}
                className="w-full bg-[#d4a574] hover:bg-[#c49565]"
              >
                Agregar tareas ({selectedTasks.length})
              </Button>
            </div>
          </Card>
        )}

        {/* Step D: First Task */}
        {currentStep === "first-task" && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#d4a574]" />
              <h3>¡Comienza tu primera tarea!</h3>
            </div>

            <div className="space-y-4">
              <div className="bg-[#e9f5f0] p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Trash2 className="w-6 h-6 text-[#6fbd9d]" />
                  <div className="flex-1">
                    <p>Sacar la basura</p>
                    <p className="text-sm text-muted-foreground">Asignada automáticamente</p>
                  </div>
                </div>
                <Progress value={firstTaskProgress} className="h-2 mb-2" />
                <p className="text-sm text-muted-foreground">{firstTaskProgress}% completado</p>
              </div>

              <div className="space-y-2">
                <h4>Pasos guiados:</h4>
                {firstTaskProgress >= 0 && (
                  <div className={`p-3 rounded-lg ${firstTaskProgress > 0 ? "bg-[#e9f5f0]" : "bg-[#f5f3ed]"}`}>
                    <div className="flex items-center gap-2">
                      {firstTaskProgress > 0 ? (
                        <CheckCircle2 className="w-5 h-5 text-[#6fbd9d]" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[#d4a574]" />
                      )}
                      <span className="text-sm">1. Recoger basura de todas las habitaciones</span>
                    </div>
                  </div>
                )}
                {firstTaskProgress >= 50 && (
                  <div className={`p-3 rounded-lg ${firstTaskProgress === 100 ? "bg-[#e9f5f0]" : "bg-[#f5f3ed]"}`}>
                    <div className="flex items-center gap-2">
                      {firstTaskProgress === 100 ? (
                        <CheckCircle2 className="w-5 h-5 text-[#6fbd9d]" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[#d4a574]" />
                      )}
                      <span className="text-sm">2. Llevar al contenedor exterior</span>
                    </div>
                  </div>
                )}
              </div>

              {firstTaskProgress < 100 && (
                <Button
                  onClick={handleFirstTaskAction}
                  className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
                >
                  {firstTaskProgress === 0 ? "Marcar paso 1 completo" : "Marcar paso 2 completo"}
                </Button>
              )}

              {firstTaskProgress === 100 && (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🎉</div>
                  <p>¡Excelente trabajo!</p>
                  <p className="text-sm text-muted-foreground">Redirigiendo a tu panel...</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
