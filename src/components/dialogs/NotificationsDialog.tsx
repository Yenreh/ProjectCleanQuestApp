import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Notification, InvitationNotification } from "../../lib/notifications";
import { Bell, Crown, Home, Mail, Award, ListTodo } from "lucide-react";
import { useState } from "react";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: Notification[];
  onActionClick: (notification: Notification) => void;
}

// Icon mapping for notification types
const notificationIcons = {
  invitation: Home,
  message: Mail,
  alert: Bell,
  achievement: Award,
  task_reminder: ListTodo
};

export function NotificationsDialog({
  open,
  onOpenChange,
  notifications,
  onActionClick
}: NotificationsDialogProps) {

  const getNotificationIcon = (type: Notification['type']) => {
    const Icon = notificationIcons[type];
    return <Icon className="w-5 h-5 text-[#6fbd9d]" />;
  };

  const getActionLabel = (notification: Notification): string | null => {
    if (!notification.action) return null;
    
    switch (notification.action) {
      case 'view_invitation':
        return 'Ver invitación';
      case 'view_achievement':
        return 'Ver logro';
      case 'view_task':
        return 'Ver tarea';
      default:
        return 'Ver';
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
