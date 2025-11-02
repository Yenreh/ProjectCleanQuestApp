import { Card } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Trophy, Users, CheckCircle2 } from "lucide-react";

interface Member {
  id: string;
  name: string;
  initials: string;
  tasksCompleted: number;
  color: string;
}

interface CompletedTask {
  id: string;
  task: string;
  member: string;
  day: string;
}

export function ProgressPanel() {
  const houseLevel = 75;
  
  const members: Member[] = [
    { id: "1", name: "Ana", initials: "AN", tasksCompleted: 8, color: "bg-[#a8d5e2]" },
    { id: "2", name: "Carlos", initials: "CA", tasksCompleted: 7, color: "bg-[#d4a574]" },
    { id: "3", name: "María", initials: "MA", tasksCompleted: 8, color: "bg-[#c8b5d3]" },
  ];

  const completedTasks: CompletedTask[] = [
    { id: "1", task: "Cocina limpia", member: "Ana", day: "Lunes" },
    { id: "2", task: "Baño organizado", member: "Carlos", day: "Martes" },
    { id: "3", task: "Sala ordenada", member: "María", day: "Miércoles" },
    { id: "4", task: "Basura sacada", member: "Ana", day: "Jueves" },
    { id: "5", task: "Platos lavados", member: "Carlos", day: "Viernes" },
  ];

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2">Progreso del Hogar Compartido</h1>
        <p className="text-muted-foreground">
          Trabajando juntos hacia un espacio armonioso
        </p>
      </div>

      {/* House Level Progress */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-[#e9f5f0] to-[#f5f3ed]">
        <div className="flex items-center gap-3 mb-3">
          <Trophy className="w-6 h-6 text-[#6fbd9d]" />
          <h3>Nivel de orden del hogar</h3>
        </div>
        <Progress value={houseLevel} className="h-3 mb-2" />
        <p className="text-sm text-muted-foreground">
          {houseLevel}% completado esta semana
        </p>
      </Card>

      {/* Team Members */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[#6fbd9d]" />
          <h3>Colaboradores del hogar</h3>
        </div>
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className={member.color}>
                  <AvatarFallback>{member.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p>{member.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {member.tasksCompleted} tareas completadas
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-[#e9f5f0] text-[#6fbd9d]">
                Equitativo
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Badges Unlocked */}
      <Card className="p-6 mb-6">
        <h3 className="mb-4">Insignias desbloqueadas</h3>
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-[#fef3e0] flex items-center justify-center">
              <Trophy className="w-8 h-8 text-[#d4a574]" />
            </div>
            <span className="text-sm text-center">Equipo en acción</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-[#e9f5f0] flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#6fbd9d]" />
            </div>
            <span className="text-sm text-center">Primera semana</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-[#f0ebf5] flex items-center justify-center">
              <Users className="w-8 h-8 text-[#c8b5d3]" />
            </div>
            <span className="text-sm text-center">Colaboradores</span>
          </div>
        </div>
      </Card>

      {/* Completed Tasks This Week */}
      <Card className="p-6">
        <h3 className="mb-4">Tareas completadas esta semana</h3>
        <div className="space-y-3">
          {completedTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#6fbd9d]" />
                <div>
                  <p>{task.task}</p>
                  <p className="text-sm text-muted-foreground">{task.member}</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">{task.day}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
