import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Notification, InvitationNotification, SwapRequestNotification, InconvenienceNotification } from "../../lib/notifications";
import { Bell, Crown, Home, Mail, Award, ListTodo, ArrowRightLeft, CheckCircle2, XCircle, Loader2, Trash2, UtensilsCrossed, Sparkles, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { db } from "../../lib/db";
import { toast } from "sonner";
import { useNotificationStore } from "../../stores";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: Notification[];
  onActionClick: (notification: Notification) => void;
  currentMemberId?: number;
  onSwapResponse?: () => void;
}

// Icon mapping for notification types
const notificationIcons = {
  invitation: Home,
  message: Mail,
  alert: Bell,
  achievement: Award,
  task_reminder: ListTodo,
  swap_request: ArrowRightLeft,
  inconvenience: AlertTriangle
};

const getTaskIcon = (iconName?: string) => {
  switch (iconName) {
    case 'trash': return <Trash2 className="w-4 h-4" />;
    case 'utensils': return <UtensilsCrossed className="w-4 h-4" />;
    case 'sparkles': return <Sparkles className="w-4 h-4" />;
    default: return <CheckCircle2 className="w-4 h-4" />;
  }
};

export function NotificationsDialog({
  open,
  onOpenChange,
  notifications,
  onActionClick,
  currentMemberId,
  onSwapResponse
}: NotificationsDialogProps) {
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [dismissingAlert, setDismissingAlert] = useState<number | null>(null);
  const { markAlertAsRead } = useNotificationStore();

  const getNotificationIcon = (type: Notification['type']) => {
    const Icon = notificationIcons[type];
    if (type === 'inconvenience') {
      return <Icon className="w-5 h-5 text-[#dc2626]" />;
    }
    return <Icon className="w-5 h-5 text-[#6fbd9d]" />;
  };

  const getActionLabel = (notification: Notification): string | null => {
    // Don't show action button for types that have custom buttons
    if (notification.type === 'swap_request' || notification.type === 'inconvenience') {
      return null;
    }
    
    if (!notification.action) return null;
    
    switch (notification.action) {
      case 'view_invitation':
        return 'Ver invitacion';
      case 'view_achievement':
        return 'Ver logro';
      case 'view_task':
        return 'Ver tarea';
      default:
        return null;
    }
  };

  const handleSwapResponse = async (requestId: number, accept: boolean) => {
    if (!currentMemberId) return;
    
    setRespondingTo(requestId);
    try {
      await db.respondToSwapRequest(requestId, currentMemberId, accept);
      toast.success(accept ? 'Intercambio aceptado' : 'Intercambio rechazado', {
        description: accept ? 'Las tareas han sido intercambiadas' : 'La solicitud ha sido rechazada'
      });
      onSwapResponse?.();
    } catch (error) {
      console.error('Error responding to swap:', error);
      toast.error('Error al responder a la solicitud');
    } finally {
      setRespondingTo(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Notificaciones</DialogTitle>
          <DialogDescription>
            Tus notificaciones recientes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No tienes notificaciones
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const actionLabel = getActionLabel(notification);
              const isSwapRequest = notification.type === 'swap_request';
              const isInconvenience = notification.type === 'inconvenience';
              const swapData = isSwapRequest ? (notification as SwapRequestNotification).data : null;
              const inconvenienceData = isInconvenience ? (notification as InconvenienceNotification).data : null;
              const isResponding = respondingTo === swapData?.requestId;
              const isDismissing = dismissingAlert === inconvenienceData?.alertId;

              const handleDismissAlert = async () => {
                if (!inconvenienceData?.alertId) return;
                setDismissingAlert(inconvenienceData.alertId);
                try {
                  await markAlertAsRead(inconvenienceData.alertId);
                  toast.success('Alerta marcada como leida');
                } catch (error) {
                  console.error('Error dismissing alert:', error);
                  toast.error('Error al marcar la alerta');
                } finally {
                  setDismissingAlert(null);
                }
              };

              return (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 ${!notification.read ? 'bg-blue-50/50' : ''} ${isInconvenience ? 'border-l-4 border-l-[#ef4444] border-[#fecaca] bg-[#fef2f2]' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${isInconvenience ? 'p-2 bg-[#fee2e2] rounded-full' : ''}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      {isInconvenience && inconvenienceData && (
                        <div className="flex items-center gap-2 text-xs text-[#991b1b] font-medium">
                          <span>Aviso de {inconvenienceData.senderName}</span>
                        </div>
                      )}
                      <p className={`text-sm leading-relaxed ${isInconvenience ? 'text-[#7f1d1d] font-medium' : ''}`}>
                        {notification.message}
                      </p>
                      
                      {notification.type === 'invitation' && (notification as InvitationNotification).data.ownerName && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Crown className="w-3.5 h-3.5" />
                          <span>{(notification as InvitationNotification).data.ownerName}</span>
                        </div>
                      )}

                      {/* Swap request details */}
                      {isSwapRequest && swapData && (
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5 bg-[#fff4e6] text-[#d4a574] px-2 py-1 rounded">
                              {getTaskIcon(swapData.requesterTaskIcon)}
                              <span>{swapData.requesterTaskTitle}</span>
                            </div>
                            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                            <div className="flex items-center gap-1.5 bg-[#e9f5f0] text-[#6fbd9d] px-2 py-1 rounded">
                              {getTaskIcon(swapData.targetTaskIcon)}
                              <span>{swapData.targetTaskTitle}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleSwapResponse(swapData.requestId, false)}
                              disabled={isResponding}
                            >
                              {isResponding ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Rechazar
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-[#6fbd9d] hover:bg-[#5fa989]"
                              onClick={() => handleSwapResponse(swapData.requestId, true)}
                              disabled={isResponding}
                            >
                              {isResponding ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Aceptar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Inconvenience alert details */}
                      {isInconvenience && (
                        <div className="alert-button-container">
                          <Button
                            size="sm"
                            className="btn-dismiss-alert-green"
                            onClick={handleDismissAlert}
                            disabled={isDismissing}
                          >
                            {isDismissing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Entendido
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {actionLabel && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => onActionClick(notification)}
                        >
                          {actionLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
