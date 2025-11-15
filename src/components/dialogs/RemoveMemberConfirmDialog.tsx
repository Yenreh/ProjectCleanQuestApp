import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertTriangle, UserX, Info } from "lucide-react";
import { Card } from "../ui/card";

interface RemoveMemberConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  memberEmail: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RemoveMemberConfirmDialog({
  open,
  onOpenChange,
  memberName,
  memberEmail,
  onConfirm,
  onCancel,
  isLoading = false
}: RemoveMemberConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-red-500" />
            Remover miembro
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas remover a este miembro del hogar?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member Info */}
          <Card className="p-4 bg-muted/30">
            <div className="space-y-1">
              <p className="font-semibold">{memberName}</p>
              <p className="text-sm text-muted-foreground">{memberEmail}</p>
            </div>
          </Card>

          {/* Warning */}
          <Card className="p-4 border-red-500/50 bg-red-500/10">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Consecuencias de esta acción</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>El miembro perderá acceso al hogar inmediatamente</li>
                    <li>Se desasignarán todas sus tareas actuales</li>
                    <li>Deberá crear un nuevo hogar o unirse a otro</li>
                    <li>Al recargar la app, será redirigido al onboarding</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Info about history preservation */}
          <Card className="p-4 border-blue-500/50 bg-blue-500/10">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Historial preservado</h4>
                <p className="text-sm text-muted-foreground">
                  Su historial de completaciones, logros y puntos se preservará 
                  en las estadísticas del hogar, pero el miembro no podrá verlo.
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              style={{
                opacity: 1,
                backgroundColor: isLoading ? '#e5e7eb' : '#dc2626',
                color: '#ffffff',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
              className="flex-1 hover:opacity-90 transition-opacity"
            >
              {isLoading ? "Removiendo..." : "Remover miembro"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
