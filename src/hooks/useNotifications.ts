import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Notification, InvitationNotification } from '../lib/notifications';

export interface Invitation {
  id: string;
  invitation_token: string;
  homes: {
    id: string;
    name: string;
    created_by: string;
    profiles?: {
      full_name: string;
      email: string;
    };
  };
}

// Función para convertir una invitación de DB a notificación
function invitationToNotification(invitation: Invitation): InvitationNotification {
  const ownerName = invitation.homes.profiles?.full_name || invitation.homes.profiles?.email;
  return {
    id: `invitation-${invitation.id}`,
    type: 'invitation',
    message: `${ownerName || 'Alguien'} te ha invitado a unirte a ${invitation.homes.name}`,
    createdAt: new Date(),
    read: false,
    action: 'view_invitation',
    data: {
      invitationId: invitation.id,
      token: invitation.invitation_token,
      homeName: invitation.homes.name,
      homeId: invitation.homes.id,
      ownerName
    }
  };
}

export function useNotifications(userEmail?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = async () => {
    if (!userEmail) {
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    try {
      const allNotifications: Notification[] = [];

      // Load invitations as notifications
      const invitation = await db.getPendingInvitationByEmail(userEmail);
      if (invitation) {
        allNotifications.push(invitationToNotification(invitation));
      }

      // TODO: Aquí se pueden agregar más tipos de notificaciones en el futuro
      // - Mensajes del sistema
      // - Recordatorios de tareas
      // - Logros desbloqueados
      // etc.

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userEmail]);

  return {
    notifications,
    isLoading,
    refresh: loadNotifications,
    unreadCount: notifications.filter(n => !n.read).length
  };
}
