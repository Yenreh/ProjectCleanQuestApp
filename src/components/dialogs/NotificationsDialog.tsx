import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Notification, InvitationNotification, SwapRequestNotification } from "../../lib/notifications";
import { Bell, Crown, Home, Mail, Award, ListTodo, ArrowRightLeft, CheckCircle2, XCircle, Loader2, Trash2, UtensilsCrossed, Sparkles } from "lucide-react";
import { useState } from "react";
import { db } from "../../lib/db";
import { toast } from "sonner";

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
  swap_request: ArrowRightLeft
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

  const getNotificationIcon = (type: Notification['type']) => {
    const Icon = notificationIcons[type];
    return <Icon className="w-5 h-5 text-[#6fbd9d]" />;
  };

  const getActionLabel = (notification: Notification): string | null => {
    if (!notification.action) return null;
    
    switch (notification.action) {
      case 'view_invitation':
        return 'Ver invitacion';
      case 'view_achievement':
        return 'Ver logro';
      case 'view_task':
        return 'Ver tarea';
      case 'view_swap_request':
        return null; // We handle swap requests with accept/reject buttons
      default:
        return 'Ver';
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
              const swapData = isSwapRequest ? (notification as SwapRequestNotification).data : null;
              const isResponding = respondingTo === swapData?.requestId;

              return (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 ${!notification.read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <p className="text-sm leading-relaxed">
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
