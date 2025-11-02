import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { CheckCircle2, Trash2, UtensilsCrossed, Sparkles } from "lucide-react";

interface Task {
  id: string;
  title: string;
  icon: React.ReactNode;
  completed: boolean;
}

export function HomeScreen() {
  const userName = "Ana";
  const completionPercentage = 65;
  
  const tasks: Task[] = [
    { id: "1", title: "Sacar la basura", icon: <Trash2 className="w-5 h-5" />, completed: false },
    { id: "2", title: "Lavar los platos", icon: <UtensilsCrossed className="w-5 h-5" />, completed: true },
    { id: "3", title: "Barrer la cocina", icon: <Sparkles className="w-5 h-5" />, completed: false },
  ];

  return (
    <div className="flex flex-col items-center px-6 py-8 max-w-md mx-auto h-full">
      {/* Header */}
      <div className="w-full mb-8">
        <h1 className="text-center mb-2">¡Bienvenido, {userName}!</h1>
        <p className="text-center text-muted-foreground">
          Tu espacio está cada vez más ordenado
        </p>
      </div>

      {/* Circular Progress */}
      <div className="relative w-48 h-48 mb-8">
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

      {/* Main Action Button */}
      <Button 
        size="lg" 
        className="w-full mb-8 h-14 bg-[#6fbd9d] hover:bg-[#5fa989]"
      >
        Cumplir tarea de hoy
      </Button>

      {/* Pending Tasks List */}
      <div className="w-full">
        <h3 className="mb-4">Tareas pendientes</h3>
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${task.completed ? 'bg-[#e9f5f0] text-[#6fbd9d]' : 'bg-[#f5f3ed] text-[#d4a574]'}`}>
                    {task.icon}
                  </div>
                  <span className={task.completed ? 'text-muted-foreground line-through' : ''}>
                    {task.title}
                  </span>
                </div>
                {task.completed && (
                  <CheckCircle2 className="w-5 h-5 text-[#6fbd9d]" />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
