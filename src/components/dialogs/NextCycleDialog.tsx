import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Calendar, RefreshCw, AlertTriangle } from "lucide-react";
import { useUnifiedSettingsStore } from "../../stores";
import type { Home } from "../../lib/types";

interface NextCycleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  home: Home | null;
  onRotate?: () => void;
}

export function NextCycleDialog({ open, onOpenChange, home, onRotate }: NextCycleDialogProps) {
  const { isRotatingCycle, closeCycleAndReassign } = useUnifiedSettingsStore();

  const handleRotate = async () => {
    if (!home) return;
    
    try {
      await closeCycleAndReassign(home.id);
      
      if (onRotate) {
        onRotate();
      }
      
      onOpenChange(false);
    } catch (error) {
      // Error already handled in store
    }
  };

  const getRotationText = () => {
    switch (home?.rotation_policy) {
      case 'daily': return 'diario';
      case 'weekly': return 'semanal';
      case 'biweekly': return 'quincenal';
      case 'monthly': return 'mensual';
      default: return 'semanal';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#6fbd9d]" />
            Configurar Próximo Ciclo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Card className="p-4 bg-[#f0f7ff]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#89a7c4] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">Política de Rotación</h4>
                <p className="text-sm text-muted-foreground">
                  Actualmente configurada como <strong>{getRotationText()}</strong>
                </p>
              </div>
            </div>
          </Card>

          {home?.auto_rotation ? (
            <Card className="p-4 bg-[#e9f5f0]">
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-[#6fbd9d] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="mb-1">Rotación Automática Activada</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Las tareas se redistribuirán automáticamente según la política configurada
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full"
                    onClick={handleRotate}
                    disabled={isRotatingCycle}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRotatingCycle ? 'animate-spin' : ''}`} />
                    {isRotatingCycle ? 'Rotando...' : 'Forzar Rotación Ahora'}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4 bg-[#fef3e0]">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#d4a574] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="mb-1">Rotación Manual</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Deberás rotar las tareas manualmente al iniciar el próximo ciclo. Esto cerrará las tareas pendientes y reasignará todas las tareas.
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full bg-[#d4a574] hover:bg-[#c49565]"
                    onClick={handleRotate}
                    disabled={isRotatingCycle}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRotatingCycle ? 'animate-spin' : ''}`} />
                    {isRotatingCycle ? 'Rotando...' : 'Cerrar Ciclo y Reasignar'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Puedes cambiar la política de rotación desde la Sala de Armonía
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full mt-4"
        >
          Cerrar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
