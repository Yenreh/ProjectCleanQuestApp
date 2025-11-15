import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { db } from "../../lib/db";
import type { AssignmentWithDetails } from "../../lib/types";

interface CancelTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: AssignmentWithDetails | null;
  memberId: number;
  onSuccess?: () => void;
}

export function CancelTaskDialog({
  open,
  onOpenChange,
  assignment,
  memberId,
  onSuccess,
}: CancelTaskDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = async () => {
    if (!assignment || !reason.trim()) {
      toast.error("Por favor escribe un motivo para cancelar");
      return;
    }

    setIsSubmitting(true);

    try {
      await db.cancelTask(assignment.id, memberId, reason.trim());

      toast.success("Tarea cancelada correctamente", {
        description: "Tus compañeros podrán verla y tomarla si desean",
      });

      setReason("");
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error canceling task:", error);
      toast.error("Error al cancelar la tarea");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span>Cancelar tarea</span>
          </DialogTitle>
          <DialogDescription>
            {assignment && (
              <>
                Vas a cancelar la tarea <strong>{assignment.task_title}</strong>.
                Esta quedará disponible para que otro miembro del hogar la tome.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Motivo de la cancelación *
            </label>
            <Textarea
              placeholder="Ejemplo: No tengo tiempo hoy, tengo un examen, surgió un imprevisto..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-24"
              disabled={isSubmitting}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {reason.length}/500 caracteres
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <p className="text-amber-900">
              <strong>Nota:</strong> Cancelar una tarea frecuentemente puede afectar
              la armonía del hogar. Úsalo solo cuando realmente lo necesites.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-center gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <Button
            onClick={handleCancel}
            disabled={!reason.trim() || isSubmitting}
            style={{
              opacity: 1,
              backgroundColor: (!reason.trim() || isSubmitting) ? '#e5e7eb' : '#dc2626',
              color: '#ffffff',
              cursor: (!reason.trim() || isSubmitting) ? 'not-allowed' : 'pointer',
            }}
            className="hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? "Cancelando..." : "Confirmar cancelación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
