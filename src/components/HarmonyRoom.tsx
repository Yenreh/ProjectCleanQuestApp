import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Trophy, Users, Home, Sparkles, CheckCircle2, BarChart3, Calendar } from "lucide-react";

interface Room {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: "clean" | "excellent";
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export function HarmonyRoom() {
  const consecutiveWeeks = 4;
  const completionRate = 92;

  const rooms: Room[] = [
    { id: "1", name: "Cocina", icon: <Sparkles className="w-6 h-6" />, status: "excellent" },
    { id: "2", name: "Baño", icon: <Sparkles className="w-6 h-6" />, status: "excellent" },
    { id: "3", name: "Sala", icon: <Home className="w-6 h-6" />, status: "clean" },
    { id: "4", name: "Habitaciones", icon: <CheckCircle2 className="w-6 h-6" />, status: "clean" },
  ];

  const achievements: Achievement[] = [
    {
      id: "1",
      title: "Círculo de Equidad",
      description: "Todos los miembros han contribuido equitativamente",
      icon: <Users className="w-8 h-8" />,
      color: "bg-[#e9f5f0] text-[#6fbd9d]",
    },
    {
      id: "2",
      title: "Hogar en Armonía",
      description: "4 semanas consecutivas con +80% de cumplimiento",
      icon: <Trophy className="w-8 h-8" />,
      color: "bg-[#fef3e0] text-[#d4a574]",
    },
    {
      id: "3",
      title: "Maestros de la Convivencia",
      description: "Excelencia en colaboración y organización",
      icon: <Sparkles className="w-8 h-8" />,
      color: "bg-[#f0ebf5] text-[#c8b5d3]",
    },
  ];

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Celebration Header */}
      <div className="text-center mb-8">
        <div className="inline-block p-4 rounded-full bg-gradient-to-br from-[#fef3e0] to-[#f0ebf5] mb-4">
          <Trophy className="w-12 h-12 text-[#d4a574]" />
        </div>
        <h1 className="mb-2">¡Han alcanzado la armonía del hogar!</h1>
        <p className="text-muted-foreground">
          Su espacio refleja la colaboración y el respeto mutuo
        </p>
      </div>

      {/* Consecutive Weeks Badge */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-[#e9f5f0] via-[#f5f3ed] to-[#fef3e0] border-2 border-[#d4a574]/20">
        <div className="flex items-center justify-center gap-3">
          <Calendar className="w-6 h-6 text-[#6fbd9d]" />
          <div className="text-center">
            <p className="text-3xl" style={{ fontWeight: 600 }}>{consecutiveWeeks}</p>
            <p className="text-sm text-muted-foreground">semanas consecutivas con {completionRate}% de cumplimiento</p>
          </div>
        </div>
      </Card>

      {/* House Visualization */}
      <Card className="p-6 mb-6">
        <h3 className="mb-4 text-center">Estado del hogar</h3>
        <div className="grid grid-cols-2 gap-4">
          {rooms.map((room) => (
            <div 
              key={room.id} 
              className={`p-4 rounded-lg text-center transition-all ${
                room.status === "excellent" 
                  ? "bg-gradient-to-br from-[#e9f5f0] to-[#d0ebe0] border-2 border-[#6fbd9d]/30" 
                  : "bg-muted/30"
              }`}
            >
              <div className={`inline-flex p-3 rounded-full mb-2 ${
                room.status === "excellent" ? "bg-[#6fbd9d]/20 text-[#6fbd9d]" : "bg-muted text-muted-foreground"
              }`}>
                {room.icon}
              </div>
              <p>{room.name}</p>
              {room.status === "excellent" && (
                <Badge className="mt-2 bg-[#6fbd9d] hover:bg-[#5fa989]">Excelente</Badge>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Achievements */}
      <Card className="p-6 mb-6">
        <h3 className="mb-4">Insignias maestras obtenidas</h3>
        <div className="space-y-4">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
              <div className={`p-3 rounded-full ${achievement.color}`}>
                {achievement.icon}
              </div>
              <div className="flex-1">
                <h4 className="mb-1">{achievement.title}</h4>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-[#6fbd9d] flex-shrink-0" />
            </div>
          ))}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          size="lg"
          className="h-14 flex flex-col items-center justify-center text-center whitespace-normal px-2"
        >
          <span className="flex items-center justify-center w-full">
            <BarChart3 className="w-5 h-5 mr-2" />
            <span className="break-words text-sm font-medium">Ver estadísticas</span>
          </span>
        </Button>
        <Button
          size="lg"
          className="h-14 bg-[#6fbd9d] hover:bg-[#5fa989] flex flex-col items-center justify-center text-center whitespace-normal px-2"
        >
          <span className="flex items-center justify-center w-full">
            <Calendar className="w-5 h-5 mr-2" />
            <span className="break-words text-sm font-medium">Plan de próxima semana</span>
          </span>
        </Button>
      </div>
    </div>
  );
}
