import { useState, ChangeEvent } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { AlertTriangle, Send } from "lucide-react";
import { db } from "../../lib/db";
import { toast } from "sonner";
import { useNotificationStore, useMembersStore } from "../../stores";

interface InconvenienceAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeId: number;
}

export function InconvenienceAlertDialog({
  open,
  onOpenChange,
  homeId,
}: InconvenienceAlertDialogProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentMember } = useMembersStore();
  const { loadNotifications } = useNotificationStore();

  const handleSubmit = async () => {
    if (!message.trim() || !currentMember?.id) return;

    setIsSubmitting(true);
    try {
      await db.createHomeAlert(homeId, currentMember.id, message.trim());
      toast.success("Alerta enviada", {
        description: "Tu aviso ha sido enviado a todos los miembros del hogar.",
      });
      setMessage("");
      onOpenChange(false);
      // Reload notifications for all members (they'll see it on their next load)
      loadNotifications();
    } catch (error) {
      console.error("Error sending alert:", error);
      toast.error("Error", {
        description: "No se pudo enviar la alerta. Intenta de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="alert-icon-circle">
              <AlertTriangle className="h-5 w-5 alert-icon" />
            </div>
            <DialogTitle>Enviar aviso al hogar</DialogTitle>
          </div>
          <DialogDescription>
            Escribe un mensaje para notificar a todos los miembros del hogar sobre un inconveniente o recordatorio importante.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Ej: Por favor recuerden sacar la basura antes de las 8pm..."
            value={message}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            className="min-h-[120px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length}/500 caracteres
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!message.trim() || isSubmitting}
            className="btn-send-alert"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Enviando..." : "Enviar aviso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
