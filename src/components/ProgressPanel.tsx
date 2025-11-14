import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Trophy, Users, CheckCircle2, Lightbulb, BarChart3, Settings, Target, Clock, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { db } from "../lib/db";
import { toast } from "sonner";
import type { HomeMember, HomeMetrics, Achievement } from "../lib/types";

type MasteryLevel = "novice" | "solver" | "expert" | "master" | "visionary";

interface ProgressPanelProps {
  masteryLevel: MasteryLevel;
  currentMember?: HomeMember | null;
  homeId?: number | null;
}

export function ProgressPanel({ masteryLevel, currentMember, homeId }: ProgressPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<HomeMetrics | null>(null);
  const [members, setMembers] = useState<HomeMember[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  
  useEffect(() => {
    if (currentMember && homeId) {
      loadData();
    }
  }, [currentMember, homeId]);

  const loadData = async () => {
    if (!homeId || !currentMember) return;
    
    setIsLoading(true);
    try {
      const [homeMetrics, homeMembers, memberAchievements] = await Promise.all([
        db.getHomeMetrics(homeId),
        db.getHomeMembers(homeId),
        db.getMemberAchievements(currentMember.id)
      ]);
      
      setMetrics(homeMetrics);
      setMembers(homeMembers.filter(m => m.status === 'active'));
      setAchievements(memberAchievements);
    } catch (error) {
      console.error('Error loading progress data:', error);
      toast.error('Error al cargar datos de progreso');
    } finally {
      setIsLoading(false);
    }
  };

  const houseLevel = metrics?.completion_percentage || 0;
  
  const suggestions = [
    { title: "Combinar tareas de cocina", impact: "+12%", effort: "bajo" },
    { title: "Ajustar frecuencia de baño", impact: "+8%", effort: "medio" },
  ];

  const changelog = [
    { date: "2 Nov 2025", change: "Meta grupal actualizada a 80%", author: "Ana" },
    { date: "28 Oct 2025", change: "Rotación cambiada a semanal", author: "Carlos" },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#6fbd9d] animate-spin mb-4" />
        <p className="text-muted-foreground">Cargando progreso...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2">Progreso del Hogar</h1>
        <p className="text-muted-foreground">
          {masteryLevel === "novice" && "Trabajando juntos hacia un espacio armonioso"}
          {masteryLevel === "solver" && "Analiza el rendimiento y optimiza"}
          {masteryLevel === "expert" && "Métricas avanzadas y planificación"}
          {masteryLevel === "master" && "Control total del sistema"}
          {masteryLevel === "visionary" && "Resultados de experimentos activos"}
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

      {/* SOLVER & EXPERT & MASTER: Advanced Tabs */}
      {(masteryLevel === "solver" || masteryLevel === "expert" || masteryLevel === "master") && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="analysis">Análisis</TabsTrigger>
            {masteryLevel === "master" && <TabsTrigger value="control">Control</TabsTrigger>}
            {masteryLevel !== "master" && <TabsTrigger value="suggestions">Consejos</TabsTrigger>}
          </TabsList>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            <Card className="p-4 bg-white">
              <h4 className="mb-3">Desglose por esfuerzo</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tareas ligeras (1 pto)</span>
                    <span>40%</span>
                  </div>
                  <Progress value={40} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tareas medias (3 ptos)</span>
                    <span>35%</span>
                  </div>
                  <Progress value={35} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tareas pesadas (5 ptos)</span>
                    <span>25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white">
              <h4 className="mb-3">Tendencia semanal</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-[#f5f3ed] rounded">
                  <span>Semana 1</span>
                  <span className="text-[#6fbd9d]">72%</span>
                </div>
                <div className="flex justify-between p-2 bg-[#f5f3ed] rounded">
                  <span>Semana 2</span>
                  <span className="text-[#6fbd9d]">75%</span>
                </div>
                <div className="flex justify-between p-2 bg-[#e9f5f0] rounded">
                  <span>Semana 3 (actual)</span>
                  <span className="text-[#6fbd9d]">78%</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-3">
            <Card className="p-4 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-[#d4a574]" />
                <h4>Sugerencias de optimización</h4>
              </div>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-[#f5f3ed] rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm flex-1">{suggestion.title}</p>
                      <Badge className="bg-[#e9f5f0] text-[#6fbd9d] ml-2">
                        {suggestion.impact}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Esfuerzo: {suggestion.effort}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Control Tab (Master only) */}
          {masteryLevel === "master" && (
            <TabsContent value="control" className="space-y-4">
              <Card className="p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-[#6fbd9d]" />
                  <h4>Metas del sistema</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#f5f3ed] rounded-lg">
                    <span className="text-sm">Meta grupal</span>
                    <Badge variant="outline">80%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#f5f3ed] rounded-lg">
                    <span className="text-sm">Umbral de rotación</span>
                    <Badge variant="outline">33%</Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    onClick={() => toast.info('Editar configuración próximamente')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Editar configuración
                  </Button>
                </div>
              </Card>

              <Card className="p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-[#89a7c4]" />
                  <h4>Salud del sistema</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-[#e9f5f0] rounded">
                    <p className="text-xl text-[#6fbd9d]">82%</p>
                    <p className="text-xs text-muted-foreground">Completitud</p>
                  </div>
                  <div className="text-center p-2 bg-[#fef3e0] rounded">
                    <p className="text-xl text-[#d4a574]">28%</p>
                    <p className="text-xs text-muted-foreground">Rotación</p>
                  </div>
                  <div className="text-center p-2 bg-[#f0f7ff] rounded">
                    <p className="text-xl text-[#89a7c4]">95%</p>
                    <p className="text-xs text-muted-foreground">Participación</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Team Members */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[#6fbd9d]" />
          <h3>Colaboradores del hogar</h3>
        </div>
        <div className="space-y-4">
          {members.map((member) => {
            const memberName = member.email?.split('@')[0] || 'Usuario';
            const memberInitials = memberName.substring(0, 2).toUpperCase();
            const colors = ['bg-[#a8d5e2]', 'bg-[#d4a574]', 'bg-[#c8b5d3]', 'bg-[#6fbd9d]'];
            const colorIndex = member.id % colors.length;
            
            return (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className={colors[colorIndex]}>
                    <AvatarFallback>{memberInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{memberName}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.tasks_completed || 0} tareas completadas
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-[#e9f5f0] text-[#6fbd9d]">
                  Equitativo
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* VISIONARY ONLY: Active Experiments */}
      {masteryLevel === "visionary" && (
        <Card className="p-4 mb-6 bg-[#fef3e0]">
          <h4 className="mb-3">🧪 Experimento activo</h4>
          <div className="p-3 bg-white rounded-lg mb-3">
            <p className="text-sm mb-1">Agrupar tareas por zona</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Día 4 de 7</span>
              <span>•</span>
              <span>Impacto esperado: +15%</span>
            </div>
          </div>
          <Progress value={57} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">57% del período de prueba</p>
        </Card>
      )}

      {/* Badges (for novice mainly, compact for others) */}
      {masteryLevel === "novice" ? (
        <Card className="p-6 mb-6">
          <h3 className="mb-4">Insignias desbloqueadas</h3>
          <div className="flex gap-4">
            {achievements.slice(0, 3).map((achievement) => (
              <div key={achievement.id} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-[#fef3e0] flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-[#d4a574]" />
                </div>
                <span className="text-sm text-center">{achievement.title}</span>
              </div>
            ))}
            {achievements.length === 0 && (
              <p className="text-sm text-muted-foreground">Completa tareas para desbloquear insignias</p>
            )}
          </div>
        </Card>
      ) : (
        <div className="flex gap-2 mb-6">
          {achievements.slice(0, 3).map((achievement) => (
            <Badge key={achievement.id} className="bg-[#fef3e0] text-[#d4a574]">
              <Trophy className="w-3 h-3 mr-1" />
              {achievement.title}
            </Badge>
          ))}
        </div>
      )}

      {/* Completed Tasks - simplified for now */}
      <Card className="p-6">
        <h3 className="mb-4">Tareas completadas esta semana</h3>
        <div className="space-y-3">
          {metrics && metrics.completed_tasks > 0 ? (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#6fbd9d]" />
                <div>
                  <p>{metrics.completed_tasks} tareas completadas</p>
                  <p className="text-sm text-muted-foreground">Esta semana</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">{metrics.total_points_earned || 0} pts</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aún no hay tareas completadas esta semana
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
