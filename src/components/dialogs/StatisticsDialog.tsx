import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { BarChart3, TrendingUp, Users, Clock, CheckCircle2 } from "lucide-react";
import type { HomeMetrics, HomeMember, Home } from "../../lib/types";

interface StatisticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: HomeMetrics | null;
  members: HomeMember[];
  home?: Home | null;
}

export function StatisticsDialog({ open, onOpenChange, metrics, members, home }: StatisticsDialogProps) {
  const getCycleName = () => {
    switch (home?.rotation_policy) {
      case 'daily': return 'días';
      case 'weekly': return 'semanas';
      case 'biweekly': return 'quincenas';
      case 'monthly': return 'meses';
      default: return 'ciclos';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#6fbd9d]" />
            Estadísticas Detalladas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Resumen General */}
          <Card className="p-4 bg-gradient-to-br from-[#e9f5f0] to-[#f5f3ed]">
            <h4 className="mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#6fbd9d]" />
              Resumen del Hogar
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-2xl font-semibold text-[#6fbd9d]">{metrics?.completion_percentage || 0}%</p>
                <p className="text-xs text-muted-foreground">Completitud</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-2xl font-semibold text-[#d4a574]">{metrics?.rotation_percentage || 0}%</p>
                <p className="text-xs text-muted-foreground">Equidad</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-2xl font-semibold text-[#89a7c4]">{metrics?.active_members || 0}</p>
                <p className="text-xs text-muted-foreground">Miembros</p>
              </div>
            </div>
          </Card>

          {/* Tareas del Ciclo */}
          <Card className="p-4">
            <h4 className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#6fbd9d]" />
              Tareas del Ciclo Actual
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Completadas</span>
                  <span className="text-[#6fbd9d]">{metrics?.completed_tasks || 0} de {metrics?.total_tasks || 0}</span>
                </div>
                <Progress value={metrics?.completion_percentage || 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Pendientes</span>
                  <span className="text-[#d4a574]">{metrics?.pending_tasks || 0}</span>
                </div>
                <Progress value={metrics?.total_tasks ? ((metrics.pending_tasks / metrics.total_tasks) * 100) : 0} className="h-2" />
              </div>
            </div>
          </Card>

          {/* Rendimiento por Miembro */}
          <Card className="p-4">
            <h4 className="mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#89a7c4]" />
              Rendimiento por Miembro
            </h4>
            <div className="space-y-3">
              {members.map((member) => {
                const memberName = member.full_name || member.email?.split('@')[0] || 'Usuario';
                const tasksCompleted = member.tasks_completed || 0;
                const totalPoints = member.total_points || 0;
                
                return (
                  <div key={member.id} className="p-3 bg-[#f5f3ed] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{memberName}</span>
                      <Badge variant="outline" className="bg-white">
                        {totalPoints} puntos
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{tasksCompleted} tareas completadas</span>
                      <span>•</span>
                      <span>Racha: {member.current_streak || 0} días</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Ciclos Consecutivos */}
          {(metrics?.consecutive_weeks || 0) > 0 && (
            <Card className="p-4 bg-[#fef3e0]">
              <h4 className="mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d4a574]" />
                Racha Consecutiva
              </h4>
              <p className="text-2xl font-semibold text-[#d4a574] mb-1">
                {metrics?.consecutive_weeks || 0} {getCycleName()}
              </p>
              <p className="text-sm text-muted-foreground">
                Manteniendo un rendimiento excepcional
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
