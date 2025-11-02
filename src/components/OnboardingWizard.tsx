import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Home, Users, ListTodo, Sparkles, CheckCircle2, Clock, Mail, Link2, Trash2, UtensilsCrossed, Droplet, BedDouble, X } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface OnboardingWizardProps {
  onComplete: () => void;
}

type Step = "create-home" | "add-roommates" | "add-tasks" | "first-task";

const taskTemplates = [
  { id: "trash", title: "Sacar la basura", icon: Trash2, zone: "cocina", frequency: "diario", effort: 1 },
  { id: "dishes", title: "Lavar los platos", icon: UtensilsCrossed, zone: "cocina", frequency: "diario", effort: 3 },
  { id: "sweep", title: "Barrer", icon: Sparkles, zone: "sala", frequency: "semanal", effort: 3 },
  { id: "bathroom", title: "Limpiar baño", icon: Droplet, zone: "baño", frequency: "semanal", effort: 5 },
  { id: "rooms", title: "Ordenar cuartos", icon: BedDouble, zone: "habitaciones", frequency: "semanal", effort: 3 },
];

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

  // Step C: Tasks
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [customTask, setCustomTask] = useState("");

  // Step D: First task
  const [firstTaskProgress, setFirstTaskProgress] = useState(0);

  const zones = ["cocina", "sala", "baño", "habitaciones", "entrada"];

  const handleCreateHome = () => {
    if (!homeName.trim()) {
      toast.error("Por favor ingresa el nombre de tu casa");
      return;
    }
    setCompletedSteps(prev => new Set([...prev, "create-home"]));
    toast.success("¡Casa creada, bienvenido! 🏡");
    setCurrentStep("add-tasks"); // Flexible: puede ir a tareas o roommates
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

  const handleToggleTask = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleAddCustomTask = () => {
    if (!customTask.trim()) return;
    setSelectedTasks(prev => [...prev, `custom-${Date.now()}`]);
    setCustomTask("");
    toast.success("Tarea personalizada agregada");
  };

  const handleCompleteTasks = () => {
    if (selectedTasks.length === 0) {
      toast.error("Agrega al menos una tarea");
      return;
    }
    setCompletedSteps(prev => new Set([...prev, "add-tasks"]));
    toast.success("¡Tareas agregadas con rotación automática! 🔄");
    setCurrentStep("first-task");
  };

  const handleFirstTaskAction = () => {
    if (firstTaskProgress === 0) {
      setFirstTaskProgress(50);
      toast.success("¡Bien hecho! 🎉 Sigue así");
    } else if (firstTaskProgress === 50) {
      setFirstTaskProgress(100);
      toast.success("¡Tarea completada! 🌟");
      setTimeout(() => {
        setCompletedSteps(prev => new Set([...prev, "first-task"]));
        onComplete();
      }, 1500);
    }
  };

  const getProgressPercentage = () => {
    return (completedSteps.size / 4) * 100;
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] px-6 py-8 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-[#6fbd9d]" />
          <h1>CleanQuest</h1>
        </div>
        <p className="text-muted-foreground">Configura tu hogar colaborativo</p>
        
        {/* Progress Header */}
        <div className="mt-4">
          <Progress value={getProgressPercentage()} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">{completedSteps.size} de 4 pasos completados</p>
        </div>
      </div>

      {/* Step Navigation Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card
          className={`p-4 cursor-pointer transition-all ${
            currentStep === "create-home" ? "ring-2 ring-[#6fbd9d] bg-[#e9f5f0]" : ""
          } ${completedSteps.has("create-home") ? "bg-white" : ""}`}
          onClick={() => setCurrentStep("create-home")}
        >
          <div className="flex items-center gap-2 mb-2">
            <Home className="w-5 h-5 text-[#6fbd9d]" />
            {completedSteps.has("create-home") && <CheckCircle2 className="w-4 h-4 text-[#6fbd9d]" />}
          </div>
          <p className="text-sm">Crear casa</p>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all ${
            currentStep === "add-roommates" ? "ring-2 ring-[#6fbd9d] bg-[#e9f5f0]" : ""
          } ${completedSteps.has("add-roommates") ? "bg-white" : ""}`}
          onClick={() => setCurrentStep("add-roommates")}
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[#89a7c4]" />
            {completedSteps.has("add-roommates") && <CheckCircle2 className="w-4 h-4 text-[#6fbd9d]" />}
          </div>
          <p className="text-sm">Roomies</p>
          <Badge variant="outline" className="mt-1 text-xs">Opcional</Badge>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all ${
            currentStep === "add-tasks" ? "ring-2 ring-[#6fbd9d] bg-[#e9f5f0]" : ""
          } ${completedSteps.has("add-tasks") ? "bg-white" : ""}`}
          onClick={() => setCurrentStep("add-tasks")}
        >
          <div className="flex items-center gap-2 mb-2">
            <ListTodo className="w-5 h-5 text-[#d4a574]" />
            {completedSteps.has("add-tasks") && <CheckCircle2 className="w-4 h-4 text-[#6fbd9d]" />}
          </div>
          <p className="text-sm">Tareas</p>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all ${
            currentStep === "first-task" ? "ring-2 ring-[#6fbd9d] bg-[#e9f5f0]" : ""
          } ${completedSteps.has("first-task") ? "bg-white" : ""}`}
          onClick={() => completedSteps.has("add-tasks") && setCurrentStep("first-task")}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-[#d4a574]" />
            {completedSteps.has("first-task") && <CheckCircle2 className="w-4 h-4 text-[#6fbd9d]" />}
          </div>
          <p className="text-sm">Primera tarea</p>
        </Card>
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
                    const Icon = template.icon;
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
                          <Icon className="w-5 h-5 text-[#d4a574]" />
                          <div>
                            <p className="text-sm">{template.title}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{template.zone}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{template.frequency}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">Esfuerzo: {template.effort}</span>
                            </div>
                          </div>
                        </div>
                        <Checkbox checked={selectedTasks.includes(template.id)} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Tarea personalizada</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Regar plantas, limpiar ventanas..."
                    value={customTask}
                    onChange={(e) => setCustomTask(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddCustomTask()}
                  />
                  <Button onClick={handleAddCustomTask} variant="outline">
                    +
                  </Button>
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
