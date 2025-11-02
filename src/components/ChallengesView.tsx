import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Clock, Trophy, Users, Sparkles, Home, UtensilsCrossed } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  time: string;
  points: number;
  type: "group" | "personal";
  participants?: number;
}

export function ChallengesView() {
  const collaborationsThisWeek = 12;

  const challenges: Challenge[] = [
    {
      id: "1",
      title: "Limpiar la cocina juntos",
      description: "Organizar y limpiar toda la cocina en equipo",
      icon: <UtensilsCrossed className="w-6 h-6" />,
      time: "30 min",
      points: 50,
      type: "group",
      participants: 2,
    },
    {
      id: "2",
      title: "Baño impecable",
      description: "Limpieza profunda del baño compartido",
      icon: <Sparkles className="w-6 h-6" />,
      time: "25 min",
      points: 40,
      type: "group",
      participants: 1,
    },
    {
      id: "3",
      title: "Organizar sala común",
      description: "Ordenar y aspirar la sala de estar",
      icon: <Home className="w-6 h-6" />,
      time: "20 min",
      points: 35,
      type: "group",
      participants: 3,
    },
    {
      id: "4",
      title: "Desafío relámpago",
      description: "Completa 3 micro-tareas en 15 minutos",
      icon: <Trophy className="w-6 h-6" />,
      time: "15 min",
      points: 30,
      type: "personal",
    },
    {
      id: "5",
      title: "Maestro del orden",
      description: "Mantén tu área personal organizada por 7 días",
      icon: <Sparkles className="w-6 h-6" />,
      time: "7 días",
      points: 100,
      type: "personal",
    },
  ];

  const groupChallenges = challenges.filter(c => c.type === "group");
  const personalChallenges = challenges.filter(c => c.type === "personal");

  const renderChallenge = (challenge: Challenge) => (
    <Card key={challenge.id} className="p-5">
      <div className="flex gap-4">
        <div className={`p-3 rounded-lg h-fit ${
          challenge.type === "group" ? "bg-[#e9f5f0] text-[#6fbd9d]" : "bg-[#fef3e0] text-[#d4a574]"
        }`}>
          {challenge.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="mb-1">{challenge.title}</h4>
              <p className="text-sm text-muted-foreground">{challenge.description}</p>
            </div>
            {challenge.type === "group" && challenge.participants && (
              <Badge variant="secondary" className="ml-2">
                <Users className="w-3 h-3 mr-1" />
                {challenge.participants}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {challenge.time}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Trophy className="w-4 h-4 text-[#d4a574]" />
              <span>+{challenge.points} puntos</span>
            </div>
          </div>
          <Button 
            className={challenge.type === "group" 
              ? "w-full bg-[#6fbd9d] hover:bg-[#5fa989]" 
              : "w-full bg-[#d4a574] hover:bg-[#c09464]"
            }
          >
            {challenge.type === "group" ? "Unirse al grupo" : "Aceptar desafío"}
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1>Desafíos y Retos</h1>
          <Card className="px-4 py-2 bg-[#e9f5f0]">
            <p className="text-sm">
              <span className="text-[#6fbd9d]" style={{ fontWeight: 600 }}>{collaborationsThisWeek}</span>
              {" "}colaboraciones esta semana
            </p>
          </Card>
        </div>
        <p className="text-muted-foreground">
          Participa en desafíos para ganar puntos y mejorar tu hogar
        </p>
      </div>

      {/* Tabs for filtering */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="group">Desafíos grupales</TabsTrigger>
          <TabsTrigger value="personal">Desafíos personales</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {challenges.map(renderChallenge)}
        </TabsContent>

        <TabsContent value="group" className="space-y-4">
          {groupChallenges.map(renderChallenge)}
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          {personalChallenges.map(renderChallenge)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
