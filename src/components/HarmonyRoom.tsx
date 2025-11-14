import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Trophy, Users, Home, Sparkles, CheckCircle2, BarChart3, Calendar, FileText, Settings, Target, Clock, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { db } from "../lib/db";
import { toast } from "sonner";
import type { Zone, Achievement, HomeMember, HomeMetrics } from "../lib/types";

type MasteryLevel = "novice" | "solver" | "expert" | "master" | "visionary";

interface HarmonyRoomProps {
  masteryLevel: MasteryLevel;
  currentMember?: HomeMember | null;
  homeId?: number | null;
}

export function HarmonyRoom({ masteryLevel, currentMember, homeId }: HarmonyRoomProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [zones, setZones] = useState<Zone[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [metrics, setMetrics] = useState<HomeMetrics | null>(null);
  const [goalPercentage, setGoalPercentage] = useState("80");
  const [rotationPolicy, setRotationPolicy] = useState("weekly");
  const [autoRotation, setAutoRotation] = useState(true);

  useEffect(() => {
    if (currentMember && homeId) {
      loadData();
    }
  }, [currentMember, homeId]);

  const loadData = async () => {
    if (!homeId || !currentMember) return;
    
    setIsLoading(true);
    try {
      const [homeZones, memberAchievements, homeMetrics] = await Promise.all([
        db.getZones(homeId),
        db.getMemberAchievements(currentMember.id),
        db.getHomeMetrics(homeId)
      ]);
      
      setZones(homeZones);
      setAchievements(memberAchievements);
      setMetrics(homeMetrics);
    } catch (error) {
      console.error('Error loading harmony room data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const consecutiveWeeks = metrics?.consecutive_weeks || 0;
  const completionRate = metrics?.completion_percentage || 0;

  const templates = [
    { id: 1, name: "Semana de exámenes", description: "Reduce tareas en 50%", active: false },
    { id: 2, name: "Visitas familiares", description: "Intensifica limpieza previa", active: false },
  ];

  const changelog = [
    { date: "2 Nov 2025", change: "Meta grupal actualizada a 80%", author: "Ana" },
    { date: "28 Oct 2025", change: "Rotación cambiada a semanal", author: "Carlos" },
  ];

  const getZoneIcon = (iconName?: string) => {
    switch (iconName) {
      case 'sparkles': return <Sparkles className="w-6 h-6" />;
      case 'home': return <Home className="w-6 h-6" />;
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
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 bg-[#f5f3ed] rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                    <Switch checked={template.active} />
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
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
                    <Button variant="ghost" size="sm" className="text-xs">
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
                    <Button variant="ghost" size="sm" className="text-xs">
                      Editar
                    </Button>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  + Agregar nuevo acuerdo
                </Button>
              </div>
            </Card>

            <Card className="p-4 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <h4>Historial de cambios</h4>
              </div>
              <div className="space-y-2">
                {changelog.map((entry, index) => (
                  <div key={index} className="p-2 border-l-2 border-[#6fbd9d] pl-3">
                    <p className="text-xs text-muted-foreground">{entry.date} • {entry.author}</p>
                    <p className="text-sm">{entry.change}</p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* House Visualization (for all levels) */}
      <Card className="p-6 mb-6">
        <h3 className="mb-4 text-center">Estado del hogar</h3>
        <div className="grid grid-cols-2 gap-4">
          {zones.map((zone) => {
            const status = completionRate >= 90 ? 'excellent' : 'clean';
            return (
              <div 
                key={zone.id} 
                className={`p-4 rounded-lg text-center transition-all ${
                  status === "excellent" 
                    ? "bg-gradient-to-br from-[#e9f5f0] to-[#d0ebe0] border-2 border-[#6fbd9d]/30" 
                    : "bg-muted/30"
                }`}
              >
                <div className={`inline-flex p-3 rounded-full mb-2 ${
                  status === "excellent" ? "bg-[#6fbd9d]/20 text-[#6fbd9d]" : "bg-muted text-muted-foreground"
                }`}>
                  {getZoneIcon(zone.icon)}
                </div>
                <p>{zone.name}</p>
                {status === "excellent" && (
                  <Badge className="mt-2 bg-[#6fbd9d] hover:bg-[#5fa989]">Excelente</Badge>
                )}
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
              <Badge className="bg-[#e9f5f0] text-[#6fbd9d]">Excelente</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Variación entre miembros:</span>
              <span className="text-muted-foreground">±8%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Índice de colaboración:</span>
              <span className="text-[#6fbd9d]">9.2/10</span>
            </div>
          </div>
        </Card>
      )}

      {/* VISIONARY: Experiments Results */}
      {masteryLevel === "visionary" && (
        <Card className="p-4 mb-6 bg-[#fef3e0]">
          <h4 className="mb-3">🧪 Experimento completado: "Agrupar tareas por zona"</h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-2 bg-white rounded">
              <p className="text-xs text-muted-foreground">Antes</p>
              <p className="text-lg">78%</p>
            </div>
            <div className="p-2 bg-[#e9f5f0] rounded">
              <p className="text-xs text-muted-foreground">Después</p>
              <p className="text-lg text-[#6fbd9d]">85%</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-[#6fbd9d] hover:bg-[#5fa989]">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Adoptar cambio
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              Revertir
            </Button>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" size="lg" className="h-14">
          <BarChart3 className="w-5 h-5 mr-2" />
          Ver estadísticas
        </Button>
        <Button size="lg" className="h-14 bg-[#6fbd9d] hover:bg-[#5fa989]">
          <Calendar className="w-5 h-5 mr-2" />
          {masteryLevel === "master" || masteryLevel === "visionary" 
            ? "Configurar semana"
            : "Próxima semana"}
        </Button>
      </div>
    </div>
  );
}
