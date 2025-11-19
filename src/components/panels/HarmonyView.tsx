import { useState, useEffect, useCallback } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Sparkles, Heart, Home as HomeIcon, TrendingUp, Users, CheckCircle2, Star, AlertTriangle, Lightbulb, Target, Home as HomeLucideIcon, Loader2, Trophy, Calendar, Clock, FileText, Settings, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { db } from "../../lib/db";
import { toast } from "sonner";
import { StatisticsDialog } from "../dialogs/StatisticsDialog";
import { NextCycleDialog } from "../dialogs/NextCycleDialog";
import type { Zone, Achievement, HomeMember, HomeMetrics, Home, ImprovementProposal } from "../../lib/types";
import { useHomeStore, useUnifiedSettingsStore, useUIStore } from "../../stores";

type MasteryLevel = "novice" | "solver" | "expert" | "master" | "visionary";

interface ChangeLogEntry {
  date: string;
  change: string;
  author: string;
}

interface HarmonyRoomProps {
  masteryLevel: MasteryLevel;
  currentMember?: HomeMember | null;
  homeId?: number | null;
}

export function HarmonyView({ masteryLevel, currentMember, homeId }: HarmonyRoomProps) {
  // Use stores
  const { currentHome } = useHomeStore();
  const {
    goalPercentage,
    rotationPolicy,
    autoRotation,
    isUpdatingGoal,
    isUpdatingRotation,
    setGoalPercentage,
    setRotationPolicy,
    setAutoRotation,
    loadHomeSettings,
    updateGoal,
    updateRotationPolicy,
    updateAutoRotation
  } = useUnifiedSettingsStore();
  const {
    statisticsOpen,
    nextCycleOpen,
    setStatisticsOpen,
    setNextCycleOpen
  } = useUIStore();
  
  // Local state for view-specific data
  const [isLoading, setIsLoading] = useState(true);
  const [zones, setZones] = useState<Zone[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [metrics, setMetrics] = useState<HomeMetrics | null>(null);
  const [members, setMembers] = useState<HomeMember[]>([]);
  const [completedProposals, setCompletedProposals] = useState<ImprovementProposal[]>([]);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [zoneStatus, setZoneStatus] = useState<{ [zoneId: number]: { total: number; completed: number; percentage: number } }>({});

  const handleUpdateGoal = async () => {
    if (!homeId || isUpdatingGoal) return;
    await updateGoal(homeId, goalPercentage);
  };
  
  const handleUpdateRotation = async () => {
    if (!homeId || isUpdatingRotation) return;
    await updateRotationPolicy(homeId, rotationPolicy as any);
  };
  
  const handleToggleAutoRotation = async () => {
    if (!homeId) return;
    await updateAutoRotation(homeId, !autoRotation);
  };

  const loadData = useCallback(async () => {
    if (!homeId || !currentMember) return;
    
    setIsLoading(true);
    try {
      const [homeZones, memberAchievements, homeMetrics, homeMembers, zonesStatus] = await Promise.all([
        db.getZones(homeId),
        db.getMemberAchievements(currentMember.id),
        db.getHomeMetrics(homeId),
        db.getHomeMembers(homeId),
        db.getZoneStatus(homeId)
      ]);
      
      setZones(homeZones);
      setAchievements(memberAchievements);
      setMetrics(homeMetrics);
      setMembers(homeMembers.filter(m => m.status === 'active'));
      setZoneStatus(zonesStatus);
      
      // Load settings from currentHome
      loadHomeSettings(currentHome);
      
      // Load proposals for Visionary
      if (masteryLevel === 'visionary') {
        const proposals = await db.getProposals(homeId, 'implemented');
        setCompletedProposals(proposals);
      }
      
      // Load change log
      await loadChangeLog();
    } catch (error) {
      console.error('Error loading harmony room data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  }, [homeId, currentMember, masteryLevel]);

  useEffect(() => {
    if (currentMember && homeId) {
      loadData();
    }
  }, [currentMember, homeId, loadData]);

  const loadChangeLog = async () => {
    if (!homeId) return;
    
    try {
      // Por ahora crear entradas de ejemplo basadas en datos reales
      const entries: ChangeLogEntry[] = [];
      
      if (currentHome) {
        entries.push({
          date: new Date(currentHome.updated_at || currentHome.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
          change: `Meta grupal configurada a ${currentHome.goal_percentage}%`,
          author: members[0]?.full_name || members[0]?.email || 'Admin'
        });
      }
      
      setChangeLog(entries);
    } catch (error) {
      console.error('Error loading change log:', error);
    }
  };

  const consecutiveWeeks = metrics?.consecutive_weeks || 0;
  const completionRate = metrics?.completion_percentage || 0;

  const getZoneIcon = (iconName?: string) => {
    switch (iconName) {
      case 'sparkles': return <Sparkles className="w-6 h-6" />;
      case 'home': return <HomeLucideIcon className="w-6 h-6" />;
      case 'utensils': return <Sparkles className="w-6 h-6" />;
      default: return <CheckCircle2 className="w-6 h-6" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#6fbd9d] animate-spin mb-4" />
        <p className="text-muted-foreground">Cargando sala de armonía...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Celebration Header */}
      <div className="text-center mb-8">
        <div className="inline-block p-4 rounded-full bg-gradient-to-br from-[#fef3e0] to-[#f0ebf5] mb-4">
          <Trophy className="w-12 h-12 text-[#d4a574]" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1>
            {masteryLevel === "master" || masteryLevel === "visionary" 
              ? "Centro de Control del Hogar"
              : "¡Sala de Armonía!"}
          </h1>
          <Badge className="bg-[#e9f5f0] text-[#6fbd9d]">
            {masteryLevel === "novice" && "Novato"}
            {masteryLevel === "solver" && "Solucionador"}
            {masteryLevel === "expert" && "Experto"}
            {masteryLevel === "master" && "Maestro"}
            {masteryLevel === "visionary" && "Visionario"}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {masteryLevel === "master" || masteryLevel === "visionary"
            ? "Gestiona acuerdos, políticas y plantillas del sistema"
            : "Su espacio refleja la colaboración y el respeto mutuo"}
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

      {/* MASTER & VISIONARY: Control Panel */}
      {(masteryLevel === "master" || masteryLevel === "visionary") && (
        <Tabs defaultValue="goals" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="goals">Metas</TabsTrigger>
            <TabsTrigger value="templates">Plantillas</TabsTrigger>
            <TabsTrigger value="rules">Acuerdos</TabsTrigger>
          </TabsList>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            <Card className="p-4 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[#6fbd9d]" />
                <h4>Meta grupal</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Porcentaje objetivo</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      value={goalPercentage}
                      onChange={(e) => setGoalPercentage(e.target.value)}
                      min="0"
                      max="100"
                    />
                    <span className="flex items-center text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="p-3 bg-[#e9f5f0] rounded-lg text-sm">
                  <p className="text-[#5fa989]">
                    Meta actual: {goalPercentage}% de completitud semanal
                  </p>
                </div>
                <Button 
                  size="sm" 
                  className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
                  onClick={handleUpdateGoal}
                  disabled={isUpdatingGoal}
                >
                  {isUpdatingGoal ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar meta'
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-4 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-[#d4a574]" />
                <h4>Política de rotación</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Frecuencia</Label>
                  <Select value={rotationPolicy} onValueChange={setRotationPolicy}>
                    <SelectTrigger className="mt-1">
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
                <div className="flex items-center justify-between">
                  <Label>Rotación automática</Label>
                  <Switch checked={autoRotation} onCheckedChange={setAutoRotation} />
                </div>
                <Button 
                  size="sm" 
                  className="w-full bg-[#d4a574] hover:bg-[#c49565]"
                  onClick={handleUpdateRotation}
                  disabled={isUpdatingRotation}
                >
                  {isUpdatingRotation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar rotación'
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-3">
            <Card className="p-4 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[#d4a574]" />
                <h4>Plantillas especiales</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Activa plantillas para situaciones específicas
              </p>
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  No hay plantillas especiales configuradas
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => toast.info('Crear plantilla personalizada próximamente')}
              >
                + Crear plantilla personalizada
              </Button>
            </Card>
          </TabsContent>

          {/* Rules/Agreements Tab */}
          <TabsContent value="rules" className="space-y-4">
            <Card className="p-4 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#89a7c4]" />
                <h4>Acuerdos del hogar</h4>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-[#f5f3ed] rounded-lg">
                  <p className="text-sm mb-2">Distribución equitativa</p>
                  <p className="text-xs text-muted-foreground">
                    Cada roomie debe tener carga similar (±15%)
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => toast.info('Editar acuerdo próximamente')}
                    >
                      Editar
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-[#f5f3ed] rounded-lg">
                  <p className="text-sm mb-2">Responsabilidad compartida</p>
                  <p className="text-xs text-muted-foreground">
                    Ayuda mutua con consenso permitida
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => toast.info('Editar acuerdo próximamente')}
                    >
                      Editar
                    </Button>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => toast.info('Agregar nuevo acuerdo próximamente')}
                >
                  + Agregar nuevo acuerdo
                </Button>
              </div>
            </Card>

            <Card className="p-4 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <h4>Historial de cambios</h4>
              </div>
              {changeLog.length > 0 ? (
                <div className="space-y-2">
                  {changeLog.map((entry, index) => (
                    <div key={index} className="p-2 border-l-2 border-[#6fbd9d] pl-3">
                      <p className="text-xs text-muted-foreground">{entry.date} • {entry.author}</p>
                      <p className="text-sm">{entry.change}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay cambios recientes registrados
                </p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* House Visualization (for all levels) */}
      <Card className="p-6 mb-6">
        <h3 className="mb-4 text-center">Estado del hogar</h3>
        <div className="grid grid-cols-2 gap-4">
          {zones.map((zone) => {
            const status = zoneStatus[zone.id];
            const percentage = status?.percentage || 0;
            const goalPercent = currentHome?.goal_percentage || 80;
            
            // Determinar el estado visual según el porcentaje
            let statusClass = '';
            let statusBadge = null;
            
            if (percentage >= goalPercent) {
              // Excelente: cumple o supera la meta
              statusClass = "bg-gradient-to-br from-[#e9f5f0] to-[#d0ebe0] border-2 border-[#6fbd9d]/30";
              statusBadge = <Badge className="mt-2 bg-[#6fbd9d] hover:bg-[#5fa989]">Excelente</Badge>;
            } else if (percentage >= goalPercent * 0.7) {
              // Bien: al menos 70% de la meta
              statusClass = "bg-gradient-to-br from-[#fef3e0] to-[#f5ecd0] border-2 border-[#d4a574]/30";
              statusBadge = <Badge className="mt-2 bg-[#d4a574] hover:bg-[#c49565]">En progreso</Badge>;
            } else if (percentage > 0) {
              // Necesita atención: hay tareas pero bajo porcentaje
              statusClass = "bg-gradient-to-br from-[#fff0f0] to-[#ffe0e0] border-2 border-[#e57373]/30";
              statusBadge = <Badge className="mt-2 bg-[#e57373] hover:bg-[#d66565]">Atención</Badge>;
            } else {
              // Sin datos o 0%
              statusClass = "bg-muted/30";
              statusBadge = <Badge variant="outline" className="mt-2">Sin datos</Badge>;
            }
            
            return (
              <div 
                key={zone.id} 
                className={`p-4 rounded-lg text-center transition-all ${statusClass}`}
              >
                <div className={`inline-flex p-3 rounded-full mb-2 ${
                  percentage >= goalPercent 
                    ? "bg-[#6fbd9d]/20 text-[#6fbd9d]" 
                    : percentage >= goalPercent * 0.7
                    ? "bg-[#d4a574]/20 text-[#d4a574]"
                    : percentage > 0
                    ? "bg-[#e57373]/20 text-[#e57373]"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {getZoneIcon(zone.icon)}
                </div>
                <p className="font-medium">{zone.name}</p>
                {status && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {status.completed}/{status.total} tareas ({percentage}%)
                  </p>
                )}
                {statusBadge}
              </div>
            );
          })}
          {zones.length === 0 && (
            <p className="col-span-2 text-center text-sm text-muted-foreground py-8">
              No hay zonas configuradas
            </p>
          )}
        </div>
      </Card>

      {/* Achievements (compact for master/visionary) */}
      {masteryLevel === "master" || masteryLevel === "visionary" ? (
        <div className="flex flex-wrap gap-2 mb-6">
          {achievements.map((achievement) => (
            <Badge key={achievement.id} className="bg-[#e9f5f0] text-[#6fbd9d]">
              <Trophy className="w-3 h-3 mr-1" />
              {achievement.title}
            </Badge>
          ))}
          {achievements.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin insignias desbloqueadas</p>
          )}
        </div>
      ) : (
        <Card className="p-6 mb-6">
          <h3 className="mb-4">Insignias maestras obtenidas</h3>
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="p-3 rounded-full bg-[#e9f5f0] text-[#6fbd9d]">
                  <Trophy className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-1">{achievement.title}</h4>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-[#6fbd9d] flex-shrink-0" />
              </div>
            ))}
            {achievements.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Completa tareas para desbloquear insignias maestras
              </p>
            )}
          </div>
        </Card>
      )}

      {/* EXPERT+ (non-visionary): Advanced Analytics */}
      {(masteryLevel === "expert" || masteryLevel === "master") && (
        <Card className="p-4 mb-6 bg-[#f0f7ff]">
          <h4 className="mb-3">Análisis de equilibrio</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Equidad de carga:</span>
              <Badge className={`${
                metrics && metrics.rotation_percentage >= 70 
                  ? 'bg-[#e9f5f0] text-[#6fbd9d]' 
                  : 'bg-[#fef3e0] text-[#d4a574]'
              }`}>
                {metrics && metrics.rotation_percentage >= 70 ? 'Excelente' : 'Regular'}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Índice de equidad:</span>
              <span className="text-muted-foreground">{metrics?.rotation_percentage || 0}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Miembros activos:</span>
              <span className="text-[#6fbd9d]">{metrics?.active_members || 0}</span>
            </div>
          </div>
        </Card>
      )}

      {/* VISIONARY: Experiments Results */}
      {masteryLevel === "visionary" && (
        <>
          {completedProposals.length > 0 ? (
            completedProposals.slice(0, 1).map((proposal) => (
              <Card key={proposal.id} className="p-4 mb-6 bg-[#fef3e0]">
                <h4 className="mb-3">🧪 Experimento completado: "{proposal.title}"</h4>
                <div className="p-3 bg-white rounded-lg mb-3">
                  <p className="text-sm text-muted-foreground mb-2">{proposal.hypothesis}</p>
                  {proposal.result_data && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 bg-muted/30 rounded">
                        <p className="text-xs text-muted-foreground">Antes</p>
                        <p className="text-lg">{proposal.result_data.before || 'N/A'}</p>
                      </div>
                      <div className="p-2 bg-[#e9f5f0] rounded">
                        <p className="text-xs text-muted-foreground">Después</p>
                        <p className="text-lg text-[#6fbd9d]">{proposal.result_data.after || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Implementado: {new Date(proposal.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </Card>
            ))
          ) : (
            <Card className="p-4 mb-6 bg-[#fef3e0]">
              <h4 className="mb-3">🧪 Experimentos</h4>
              <p className="text-sm text-muted-foreground">
                No hay experimentos completados aún
              </p>
            </Card>
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          size="lg" 
          className="h-14"
          onClick={() => setStatisticsOpen(true)}
        >
          <BarChart3 className="w-5 h-5 mr-2" />
          Ver estadísticas
        </Button>
        <Button 
          size="lg" 
          className="h-14 bg-[#6fbd9d] hover:bg-[#5fa989]"
          onClick={() => setNextCycleOpen(true)}
        >
          <Calendar className="w-5 h-5 mr-2" />
          Próximo ciclo
        </Button>
      </div>

      {/* Dialogs */}
      <StatisticsDialog
        open={statisticsOpen}
        onOpenChange={setStatisticsOpen}
        metrics={metrics}
        members={members}
        home={currentHome}
      />

      <NextCycleDialog
        open={nextCycleOpen}
        onOpenChange={setNextCycleOpen}
        home={currentHome}
      />
    </div>
  );
}
