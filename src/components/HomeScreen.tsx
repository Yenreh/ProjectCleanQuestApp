import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { CheckCircle2, Trash2, UtensilsCrossed, Sparkles, Circle, Lightbulb, AlertCircle, Calculator, ChevronDown, ChevronUp, GripVertical, TrendingUp, Heart } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

interface Task {
  id: string;
  title: string;
  icon: React.ReactNode;
  completed: boolean;
  day?: string;
  effort?: number;
  assignee?: string;
}

type MasteryLevel = "novice" | "solver" | "expert" | "master" | "visionary";

interface HomeScreenProps {
  masteryLevel: MasteryLevel;
}

export function HomeScreen({ masteryLevel }: HomeScreenProps) {
  const userName = "Ana";
  const completionPercentage = 78;
  const rotationPercentage = 28;
  const [showCalculation, setShowCalculation] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  
  const tasks: Task[] = [
    { id: "1", title: "Sacar la basura", icon: <Trash2 className="w-5 h-5" />, completed: false, day: "Lun", effort: 1, assignee: "Ana" },
    { id: "2", title: "Lavar los platos", icon: <UtensilsCrossed className="w-5 h-5" />, completed: true, day: "Mar", effort: 3, assignee: "Carlos" },
    { id: "3", title: "Barrer la cocina", icon: <Sparkles className="w-5 h-5" />, completed: false, day: "Mié", effort: 3, assignee: "Ana" },
  ];

  const completedCount = tasks.filter(t => t.completed).length;

  // Simulate what-if for expert level
  const whatIfCompletion = selectedTask ? 85 : completionPercentage;
  const whatIfRotation = selectedTask ? 22 : rotationPercentage;

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

      {/* NOVICE: Rotation Status */}
      {masteryLevel === "novice" && (
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
      )}

      {/* SOLVER: How It's Calculated */}
      {masteryLevel === "solver" && (
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

      {/* EXPERT: What-If Impact Panel */}
      {masteryLevel === "expert" && selectedTask && (
        <Card className="p-4 mb-4 w-full bg-[#f0f7ff]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-[#89a7c4]" />
            <h4>Impacto si reasignas</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
        </Card>
      )}

      {/* MASTER: Quick Controls */}
      {masteryLevel === "master" && (
        <Card className="p-4 mb-4 w-full bg-white">
          <h4 className="mb-3">Controles rápidos</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-[#f5f3ed] rounded">
              <span className="text-sm">Meta grupal:</span>
              <Badge variant="outline">80%</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#f5f3ed] rounded">
              <span className="text-sm">Rotación:</span>
              <Badge variant="outline">Semanal</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#f5f3ed] rounded">
              <span className="text-sm">Recordatorios:</span>
              <Badge className="bg-[#6fbd9d]">09:00</Badge>
            </div>
          </div>
        </Card>
      )}

      {/* VISIONARY: Quick Proposal */}
      {masteryLevel === "visionary" && (
        <Card className="p-4 mb-4 w-full bg-[#fef3e0]">
          <h4 className="mb-2">💡 Propuesta rápida</h4>
          <Input placeholder="Nueva idea de mejora..." className="mb-2 text-sm" />
          <Button size="sm" className="w-full bg-[#d4a574] hover:bg-[#c49565]">
            Enviar a votación
          </Button>
        </Card>
      )}

      {/* Main Action Button */}
      <Button 
        size="lg" 
        className="w-full mb-6 h-14 bg-[#6fbd9d] hover:bg-[#5fa989]"
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
            <span className="text-sm text-muted-foreground">{completedCount}/{tasks.length}</span>
          )}
        </div>
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card 
              key={task.id} 
              className={`p-4 ${masteryLevel === "expert" ? "cursor-move" : ""} ${
                selectedTask === task.id ? "ring-2 ring-[#6fbd9d] shadow-md" : ""
              }`}
              draggable={masteryLevel === "expert"}
              onDragStart={() => masteryLevel === "expert" && setSelectedTask(task.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {masteryLevel === "expert" && (
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div className={`p-2 rounded-lg ${task.completed ? 'bg-[#e9f5f0] text-[#6fbd9d]' : 'bg-[#f5f3ed] text-[#d4a574]'}`}>
                    {task.icon}
                  </div>
                  <div className="flex-1">
                    <span className={task.completed ? 'text-muted-foreground line-through' : ''}>
                      {task.title}
                    </span>
                    {(masteryLevel === "solver" || masteryLevel === "expert") && task.day && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{task.day}</span>
                        {task.effort && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">Esfuerzo: {task.effort}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {task.completed && (
                    <CheckCircle2 className="w-5 h-5 text-[#6fbd9d]" />
                  )}
                  {!task.completed && masteryLevel === "novice" && (
                    <Circle className="w-5 h-5 text-[#d4a574]" />
                  )}
                  {masteryLevel === "expert" && task.assignee && (
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <Heart className="w-3 h-3" />
                    </Button>
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
        <Button variant="outline" className="w-full mt-4">
          Probar otro camino
        </Button>
      )}
    </div>
  );
}
