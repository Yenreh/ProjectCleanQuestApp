import { useState, useEffect, useCallback } from "react";
import { Card } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { TrendingUp, TrendingDown, Minus, Trophy, Zap, Target, Settings, Lightbulb, Users, Clock, CheckCircle2, Star, Loader2, AlertCircle, Calendar, Home as HomeIcon, BarChart3, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { AvailableTasksDialog } from "../dialogs/AvailableTasksDialog";
import { db } from "../../lib/db";
import { toast } from "sonner";
import type { HomeMember, HomeMetrics, Home, ImprovementProposal } from "../../lib/types";
import { useHomeStore, useAssignmentsStore, useUIStore } from "../../stores";

type MasteryLevel = "novice" | "solver" | "expert" | "master" | "visionary";

interface TaskEffortBreakdown {
  light: number;
  medium: number;
  heavy: number;
}

interface WeeklyTrend {
  week: string;
  percentage: number;
}

interface ChangeLogEntry {
  date: string;
  description: string;
  changedBy: string;
}

interface ProgressPanelProps {
  masteryLevel: MasteryLevel;
  currentMember?: HomeMember | null;
  homeId?: number | null;
}

export function ProgressView({ masteryLevel, currentMember, homeId }: ProgressPanelProps) {
  // Use homeStore for shared data
  const { currentHome } = useHomeStore();
  
  // Local state for view-specific data
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<HomeMetrics | null>(null);
  const [members, setMembers] = useState<HomeMember[]>([]);
  const [effortBreakdown, setEffortBreakdown] = useState<TaskEffortBreakdown>({ light: 0, medium: 0, heavy: 0 });
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [activeProposals, setActiveProposals] = useState<ImprovementProposal[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Use stores
  const { loadAssignments } = useAssignmentsStore();
  const { availableTasksOpen, setAvailableTasksOpen } = useUIStore();
  
  const loadData = useCallback(async () => {
    if (!homeId || !currentMember) return;
    
    setIsLoading(true);
    try {
      const [homeMetrics, homeMembers] = await Promise.all([
        db.getHomeMetrics(homeId),
        db.getHomeMembers(homeId)
      ]);
      
      setMetrics(homeMetrics);
      setMembers(homeMembers.filter(m => m.status === 'active'));
      
      // Load effort breakdown
      await loadEffortBreakdown();
      
      // Load weekly trend for Solver+
      if (masteryLevel !== 'novice') {
        await loadWeeklyTrend();
      }
      
      // Load change log for Expert+
      if (masteryLevel === 'expert' || masteryLevel === 'solver') {
        await loadChangeLog();
      }
      
      // Load proposals for Visionary
      if (masteryLevel === 'visionary') {
        await loadActiveProposals();
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
      toast.error('Error al cargar datos de progreso');
    } finally {
      setIsLoading(false);
    }
  }, [homeId, currentMember, masteryLevel]);

  useEffect(() => {
    if (currentMember && homeId) {
      loadData();
    }
  }, [currentMember, homeId, loadData]);

  const loadEffortBreakdown = async () => {
    if (!homeId) return;
    
    try {
      const tasks = await db.getTasks(homeId, true);
      let light = 0, medium = 0, heavy = 0;
      
      tasks.forEach(task => {
        if (task.effort_points <= 2) light++;
        else if (task.effort_points <= 4) medium++;
        else heavy++;
      });
      
      const total = tasks.length || 1;
      setEffortBreakdown({
        light: Math.round((light / total) * 100),
        medium: Math.round((medium / total) * 100),
        heavy: Math.round((heavy / total) * 100)
      });
    } catch (error) {
      console.error('Error loading effort breakdown:', error);
    }
  };

  const loadWeeklyTrend = async () => {
    if (!homeId) return;
    
    try {
      // OPTIMIZATION: Get data for the last 3 weeks in PARALLEL instead of sequential
      const today = new Date();
      const weekPromises = [];
      
      for (let i = 2; i >= 0; i--) {
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        
        weekPromises.push(
          db.calculateRotationPercentage(
            homeId,
            weekStart.toISOString().split('T')[0],
            weekEnd.toISOString().split('T')[0]
          ).then(percentage => ({
            week: i === 0 ? 'Semana actual' : `Hace ${i} semana${i > 1 ? 's' : ''}`,
            percentage: 100 - percentage // Invertir para mostrar completitud
          }))
        );
      }
      
      const trends = await Promise.all(weekPromises);
      setWeeklyTrend(trends);
    } catch (error) {
      console.error('Error loading weekly trend:', error);
    }
  };

  const loadChangeLog = async () => {
    if (!homeId) return;
    
    try {
      // For now, we'll create placeholder data
      // TODO: Implement actual change_log queries when available
      setChangeLog([
        {
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
          description: 'Meta grupal actualizada a ' + (currentHome?.goal_percentage || 80) + '%',
          changedBy: members[0]?.full_name || members[0]?.email || 'Admin'
        }
      ]);
    } catch (error) {
      console.error('Error loading change log:', error);
    }
  };

  const loadActiveProposals = async () => {
    if (!homeId) return;
    
    try {
      const proposals = await db.getProposals(homeId, 'testing');
      setActiveProposals(proposals);
    } catch (error) {
      console.error('Error loading proposals:', error);
    }
  };

  const houseLevel = metrics?.completion_percentage || 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#6fbd9d] animate-spin mb-4" />
        <p className="text-muted-foreground">Cargando progreso...</p>
      </div>
    );
  }

  // Determinar qué tabs mostrar según el nivel
  const getTabsForLevel = () => {
    if (masteryLevel === "novice") {
      return null; // Sin tabs, vista simple
    } else if (masteryLevel === "solver") {
      return ["overview", "analysis", "management"];
    } else if (masteryLevel === "expert") {
      return ["overview", "analysis", "management", "level"];
    } else if (masteryLevel === "master") {
      return ["overview", "analysis", "control", "level"];
    } else if (masteryLevel === "visionary") {
      return ["overview", "analysis", "control", "experiments"];
    }
    return ["overview"];
  };

  const tabs = getTabsForLevel();

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

      {/* NOVICE: Simple View (Sin Tabs) */}
      {masteryLevel === "novice" && (
        <>
          {/* Team Members */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#6fbd9d]" />
              <h3>Colaboradores del hogar</h3>
            </div>
            <div className="space-y-4">
              {members.map((member) => {
                const memberName = member.full_name || member.email?.split('@')[0] || 'Usuario';
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

          {/* Contextual Tip */}
          <Card className="p-4 bg-[#f0f7ff]">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-[#89a7c4] flex-shrink-0" />
              <div>
                <h4 className="mb-1">Consejo</h4>
                <p className="text-sm text-muted-foreground">
                  Mantén un ritmo constante para desbloquear nuevas insignias y subir de nivel
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* SOLVER+: Tabbed Interface */}
      {tabs && tabs.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full !grid grid-cols-4">
            {tabs.includes("overview") && (
              <TabsTrigger value="overview">
                <HomeIcon className="w-4 h-4" />
              </TabsTrigger>
            )}
            {tabs.includes("analysis") && (
              <TabsTrigger value="analysis">
                <BarChart3 className="w-4 h-4" />
              </TabsTrigger>
            )}
            {tabs.includes("management") && (
              <TabsTrigger value="management">
                <Users className="w-4 h-4" />
              </TabsTrigger>
            )}
            {tabs.includes("control") && (
              <TabsTrigger value="control">
                <Settings className="w-4 h-4" />
              </TabsTrigger>
            )}
            {tabs.includes("level") && (
              <TabsTrigger value="level">
                <Target className="w-4 h-4" />
              </TabsTrigger>
            )}
            {tabs.includes("experiments") && (
              <TabsTrigger value="experiments">
                <Sparkles className="w-4 h-4" />
              </TabsTrigger>
            )}
          </TabsList>          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Team Members - Compact for Solver+ */}
            <Card className="p-4 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-[#6fbd9d]" />
                <h4>Colaboradores</h4>
              </div>
              <div className="space-y-2">
                {members.map((member) => {
                  const memberName = member.full_name || member.email?.split('@')[0] || 'Usuario';
                  return (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-[#f5f3ed] rounded">
                      <span className="text-sm">{memberName}</span>
                      <span className="text-sm text-muted-foreground">{member.tasks_completed || 0} tareas</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* Analysis Tab (Solver+) */}
          {(masteryLevel === "solver" || masteryLevel === "expert" || masteryLevel === "master" || masteryLevel === "visionary") && (
            <TabsContent value="analysis" className="space-y-4">
              <Card className="p-4 bg-white">
                <h4 className="mb-3">Desglose por esfuerzo</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Tareas ligeras (1-2 ptos)</span>
                      <span>{effortBreakdown.light}%</span>
                    </div>
                    <Progress value={effortBreakdown.light} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Tareas medias (3-4 ptos)</span>
                      <span>{effortBreakdown.medium}%</span>
                    </div>
                    <Progress value={effortBreakdown.medium} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Tareas pesadas (5+ ptos)</span>
                      <span>{effortBreakdown.heavy}%</span>
                    </div>
                    <Progress value={effortBreakdown.heavy} className="h-2" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white">
                <h4 className="mb-3">Tendencia semanal</h4>
                {weeklyTrend.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {weeklyTrend.map((trend, index) => (
                      <div 
                        key={index} 
                        className={`flex justify-between p-2 rounded ${
                          index === weeklyTrend.length - 1 ? 'bg-[#e9f5f0]' : 'bg-[#f5f3ed]'
                        }`}
                      >
                        <span>{trend.week}</span>
                        <span className="text-[#6fbd9d]">{trend.percentage}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay suficientes datos históricos</p>
                )}
              </Card>

              <Card className="p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-[#d4a574]" />
                  <h4>Estadísticas generales</h4>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-[#f5f3ed] rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total de tareas activas</span>
                      <Badge className="bg-[#e9f5f0] text-[#6fbd9d]">
                        {metrics?.total_tasks || 0}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-[#f5f3ed] rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Miembros activos</span>
                      <Badge className="bg-[#e9f5f0] text-[#6fbd9d]">
                        {metrics?.active_members || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          )}

          {/* Management Tab (Solver+) */}
          {(masteryLevel === "solver" || masteryLevel === "expert") && (
            <TabsContent value="management" className="space-y-4">
              <Card className="p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-[#d4a574]" />
                  <h4>Gestión de tareas</h4>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mb-3"
                  onClick={() => setAvailableTasksOpen(true)}
                >
                  Ver tareas disponibles
                </Button>
                <p className="text-xs text-muted-foreground">
                  Las tareas canceladas por otros miembros aparecerán aquí
                </p>
              </Card>

              <Card className="p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-[#89a7c4]" />
                  <h4>Historial de cambios</h4>
                </div>
                {changeLog.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {changeLog.map((entry, index) => (
                      <div key={index} className="p-2 bg-[#f5f3ed] rounded">
                        <p className="font-medium">{entry.date}</p>
                        <p className="text-muted-foreground">{entry.description}</p>
                        <p className="text-xs text-muted-foreground">Por: {entry.changedBy}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay cambios recientes registrados</p>
                )}
              </Card>
            </TabsContent>
          )}

          {/* Control Tab (Master+) */}
          {(masteryLevel === "master" || masteryLevel === "visionary") && (
            <TabsContent value="control" className="space-y-4">
              <Card className="p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-[#6fbd9d]" />
                  <h4>Metas del sistema</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#f5f3ed] rounded-lg">
                    <span className="text-sm">Meta grupal</span>
                    <Badge variant="outline">{currentHome?.goal_percentage || 80}%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#f5f3ed] rounded-lg">
                    <span className="text-sm">Política de rotación</span>
                    <Badge variant="outline">
                      {currentHome?.rotation_policy === 'daily' && 'Diaria'}
                      {currentHome?.rotation_policy === 'weekly' && 'Semanal'}
                      {currentHome?.rotation_policy === 'biweekly' && 'Quincenal'}
                      {currentHome?.rotation_policy === 'monthly' && 'Mensual'}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-[#89a7c4]" />
                  <h4>Salud del sistema</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-[#e9f5f0] rounded">
                    <p className="text-xl text-[#6fbd9d]">{metrics?.completion_percentage || 0}%</p>
                    <p className="text-xs text-muted-foreground">Completitud</p>
                  </div>
                  <div className="text-center p-2 bg-[#fef3e0] rounded">
                    <p className="text-xl text-[#d4a574]">{metrics?.rotation_percentage || 0}%</p>
                    <p className="text-xs text-muted-foreground">Equidad</p>
                  </div>
                  <div className="text-center p-2 bg-[#f0f7ff] rounded">
                    <p className="text-xl text-[#89a7c4]">{metrics?.active_members || 0}</p>
                    <p className="text-xs text-muted-foreground">Miembros</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          )}

          {/* Level Progress Tab (Expert+) */}
          {(masteryLevel === "expert" || masteryLevel === "master") && (
            <TabsContent value="level" className="space-y-4">
              <Card className="p-4 bg-gradient-to-br from-[#e9f5f0] to-[#f0f7ff]">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-[#89a7c4]" />
                  <h4>Progreso al siguiente nivel</h4>
                </div>
                <div className="space-y-3">
                  {/* Requisito por tareas */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Tareas completadas</span>
                      <span className="text-[#6fbd9d]">
                        {currentMember?.tasks_completed || 0}/{masteryLevel === "expert" ? 30 : 60}
                      </span>
                    </div>
                    <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#6fbd9d] transition-all"
                        style={{ 
                          width: `${Math.min(((currentMember?.tasks_completed || 0) / (masteryLevel === "expert" ? 30 : 60)) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Requisito por semanas */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Semanas activas</span>
                      <span className="text-[#6fbd9d]">
                        {currentMember?.weeks_active || 0}/{masteryLevel === "expert" ? 3 : 5}
                      </span>
                    </div>
                    <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#6fbd9d] transition-all"
                        style={{ 
                          width: `${Math.min(((currentMember?.weeks_active || 0) / (masteryLevel === "expert" ? 3 : 5)) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {masteryLevel === "expert" 
                      ? "Completa 30 tareas O mantente activo 3 semanas para alcanzar nivel Maestro"
                      : "Completa 60 tareas O mantente activo 5 semanas para alcanzar nivel Visionario"}
                  </p>
                </div>
              </Card>

              <Card className="p-4 bg-white">
                <h4 className="mb-3">Próximas insignias</h4>
                <div className="space-y-2">
                  {(currentMember?.current_streak || 0) < 7 && (
                    <div className="flex items-center justify-between p-3 bg-[#f5f3ed] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm">Racha Limpia</p>
                          <p className="text-xs text-muted-foreground">7 días seguidos</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {currentMember?.current_streak || 0}/7
                      </Badge>
                    </div>
                  )}
                  
                  {(currentMember?.tasks_completed || 0) < 25 && (currentMember?.tasks_completed || 0) >= 10 && (
                    <div className="flex items-center justify-between p-3 bg-[#f5f3ed] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm">Miembro Dedicado</p>
                          <p className="text-xs text-muted-foreground">25 tareas completadas</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {currentMember?.tasks_completed || 0}/25
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          )}

          {/* Experiments Tab (Visionary) */}
          {masteryLevel === "visionary" && (
            <TabsContent value="experiments" className="space-y-4">
              {activeProposals.length > 0 ? (
                activeProposals.map((proposal) => {
                  const testStart = proposal.test_start_date ? new Date(proposal.test_start_date) : new Date();
                  const testEnd = proposal.test_end_date ? new Date(proposal.test_end_date) : new Date();
                  const today = new Date();
                  const totalDays = Math.max(1, Math.ceil((testEnd.getTime() - testStart.getTime()) / (1000 * 60 * 60 * 24)));
                  const elapsedDays = Math.ceil((today.getTime() - testStart.getTime()) / (1000 * 60 * 60 * 24));
                  const progress = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
                  
                  return (
                    <Card key={proposal.id} className="p-4 bg-[#fef3e0]">
                      <h4 className="mb-3">🧪 Experimento activo</h4>
                      <div className="p-3 bg-white rounded-lg mb-3">
                        <p className="text-sm mb-1">{proposal.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Día {elapsedDays} de {totalDays}</span>
                          <span>•</span>
                          <span>{proposal.expected_impact || 'Midiendo impacto'}</span>
                        </div>
                      </div>
                      <Progress value={progress} className="h-2 mb-2" />
                      <p className="text-xs text-muted-foreground">{progress}% del período de prueba</p>
                    </Card>
                  );
                })
              ) : (
                <Card className="p-4 bg-[#fef3e0]">
                  <h4 className="mb-3">🧪 Experimentos</h4>
                  <p className="text-sm text-muted-foreground">No hay experimentos activos en este momento</p>
                </Card>
              )}

              <Card className="p-4 bg-white">
                <h4 className="mb-3">Propuestas disponibles</h4>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => toast.info('Gestión de propuestas próximamente')}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ver todas las propuestas
                </Button>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Available Tasks Dialog */}
      <AvailableTasksDialog
        open={availableTasksOpen}
        onOpenChange={setAvailableTasksOpen}
        homeId={homeId || 0}
        currentMemberId={currentMember?.id || 0}
        onTaskTaken={async () => {
          // Reload assignments and metrics
          if (currentMember && homeId) {
            await loadAssignments(currentMember.id, homeId);
            await loadData();
          }
        }}
      />
    </div>
  );
}
