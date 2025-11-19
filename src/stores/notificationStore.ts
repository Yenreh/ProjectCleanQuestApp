import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from '../lib/db';
import { Notification, InvitationNotification } from '../lib/notifications';

interface Invitation {
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

interface NotificationState {
  // State
  notifications: Notification[];
  isLoading: boolean;
  userEmail: string | null;
  
  // Computed
  unreadCount: () => number;
  
  // Actions
  setUserEmail: (email: string | null) => void;
  loadNotifications: (email?: string) => Promise<void>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      notifications: [],
      isLoading: false,
      userEmail: null,
      
      // Computed
      unreadCount: () => {
        return get().notifications.filter(n => !n.read).length;
      },
      
      // Actions
      setUserEmail: (email) => {
        set({ userEmail: email });
        if (email) {
          get().loadNotifications(email);
        } else {
          set({ notifications: [] });
        }
      },
      
      loadNotifications: async (email?: string) => {
        const targetEmail = email || get().userEmail;
        
        if (!targetEmail) {
          set({ notifications: [] });
          return;
        }
        
        set({ isLoading: true });
        try {
          const allNotifications: Notification[] = [];
          
          // Load invitations as notifications
          const invitation = await db.getPendingInvitationByEmail(targetEmail);
          if (invitation) {
            allNotifications.push(invitationToNotification(invitation));
          }
          
          // TODO: Aquí se pueden agregar más tipos de notificaciones en el futuro
          // - Mensajes del sistema
          // - Recordatorios de tareas
          // - Logros desbloqueados
          // etc.
          
          set({ notifications: allNotifications });
        } catch (error) {
          console.error('Error loading notifications:', error);
          set({ notifications: [] });
        } finally {
          set({ isLoading: false });
        }
      },
      
      markAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        }));
      },
      
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        }));
      },
      
      clearNotifications: () => {
        set({ notifications: [], userEmail: null });
      }
    }),
    { name: 'NotificationStore' }
  )
);
