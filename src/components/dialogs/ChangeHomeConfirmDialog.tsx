import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertTriangle, Home, ArrowRight, Crown } from "lucide-react";
import { Card } from "../ui/card";

interface ChangeHomeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentHomeName: string | null;
  currentHomeOwner?: string;
  newHomeName: string;
  newHomeOwner?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ChangeHomeConfirmDialog({
  open,
  onOpenChange,
  currentHomeName,
  currentHomeOwner,
  newHomeName,
  newHomeOwner,
  onConfirm,
  onCancel,
  isLoading = false
}: ChangeHomeConfirmDialogProps) {
  const hasCurrentHome = !!currentHomeName;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{hasCurrentHome ? 'Cambiar de casa' : 'Unirse a un hogar'}</DialogTitle>
          <DialogDescription>
            {hasCurrentHome 
              ? 'Ya perteneces a una casa. ¿Deseas cambiar a otra?'
              : '¿Deseas unirte a este hogar?'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current and New Home Comparison */}
          {hasCurrentHome ? (
            <div className="flex items-center gap-3">
              <Card className="flex-1 p-4 bg-[#e8dff0]">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-[#9b7cb8]" />
                  <p className="text-xs text-[#9b7cb8]">Casa actual</p>
                </div>
                <p className="font-semibold">{currentHomeName}</p>
                {currentHomeOwner && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#9b7cb8]/20">
                    <Crown className="h-3 w-3 text-yellow-600" />
                    <p className="text-xs text-muted-foreground">{currentHomeOwner}</p>
                  </div>
                )}
              </Card>

              <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

              <Card className="flex-1 p-4 bg-[#d4f0e3]">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-[#4a9d72]" />
                  <p className="text-xs text-[#4a9d72]">Casa nueva</p>
                </div>
                <p className="font-semibold">{newHomeName}</p>
                {newHomeOwner && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#4a9d72]/20">
                    <Crown className="h-3 w-3 text-yellow-600" />
                    <p className="text-xs text-muted-foreground">{newHomeOwner}</p>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <Card className="p-4 bg-[#d4f0e3]">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-[#4a9d72]" />
                <p className="text-xs text-[#4a9d72]">Hogar</p>
              </div>
              <p className="font-semibold">{newHomeName}</p>
              {newHomeOwner && (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#4a9d72]/20">
                  <Crown className="h-3 w-3 text-yellow-600" />
                  <p className="text-xs text-muted-foreground">{newHomeOwner}</p>
                </div>
              )}
            </Card>
          )}

          {/* Warning - Only show when changing homes */}
          {hasCurrentHome && (
            <Card className="p-4 border-yellow-500/50 bg-yellow-500/10">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Advertencia</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Al cambiar de casa:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Perderás acceso a tu casa actual</li>
                      <li>Ya no verás las tareas y estadísticas actuales</li>
                      <li>Tu historial se preservará pero no será visible</li>
                      <li>Comenzarás desde cero en la nueva casa</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          )}

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
              className="flex-1 bg-[#6fbd9d] hover:bg-[#5fa989]"
            >
              {isLoading ? (hasCurrentHome ? "Cambiando..." : "Uniéndose...") : (hasCurrentHome ? "Cambiar de casa" : "Unirse")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
