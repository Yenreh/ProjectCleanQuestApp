import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from '../lib/db';
import { Notification, InvitationNotification, SwapRequestNotification, InconvenienceNotification } from '../lib/notifications';
import type { SwapRequestWithDetails } from '../lib/types';

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

interface HomeAlert {
  id: number;
  message: string;
  created_at: string;
  created_by: number;
  home_members: {
    id: number;
    full_name: string | null;
    email: string;
  };
}

// Funcion para convertir una invitacion de DB a notificacion
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

// Funcion para convertir una solicitud de intercambio a notificacion
function swapRequestToNotification(request: SwapRequestWithDetails): SwapRequestNotification {
  const requesterName = request.requester.profiles?.full_name || request.requester.full_name || request.requester.email;
  const requesterTask = request.task_assignments?.tasks;
  const targetTask = request.target_assignment?.tasks;
  
  return {
    id: `swap-${request.id}`,
    type: 'swap_request',
    message: `${requesterName} quiere intercambiar "${requesterTask?.title || 'su tarea'}" por "${targetTask?.title || 'tu tarea'}"`,
    createdAt: new Date(request.created_at),
    read: false,
    action: 'view_swap_request',
    data: {
      requestId: request.id,
      requesterName: requesterName,
      requesterTaskTitle: requesterTask?.title || 'Tarea',
      requesterTaskIcon: requesterTask?.icon || 'check-circle',
      targetTaskTitle: targetTask?.title || 'Tu tarea',
      targetTaskIcon: targetTask?.icon || 'check-circle'
    }
  };
}

// Funcion para convertir una alerta de inconveniente a notificacion
function homeAlertToNotification(alert: HomeAlert): InconvenienceNotification {
  const senderName = alert.home_members?.full_name || alert.home_members?.email || 'Un miembro';
  return {
    id: `alert-${alert.id}`,
    type: 'inconvenience',
    message: alert.message,
    createdAt: new Date(alert.created_at),
    read: false,
    action: 'view_inconvenience',
    data: {
      alertId: alert.id,
      senderName: senderName,
      message: alert.message
    }
  };
}

interface NotificationState {
  // State
  notifications: Notification[];
  isLoading: boolean;
  userEmail: string | null;
  currentMemberId: number | null;
  currentHomeId: number | null;
  
  // Computed
  unreadCount: () => number;
  
  // Actions
  setUserEmail: (email: string | null) => void;
  setCurrentMemberId: (memberId: number | null) => void;
  setCurrentHomeId: (homeId: number | null) => void;
  loadNotifications: (email?: string, memberId?: number, homeId?: number) => Promise<void>;
  markAsRead: (notificationId: string) => void;
  markAlertAsRead: (alertId: number) => Promise<void>;
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
      currentMemberId: null,
      currentHomeId: null,
      
      // Computed
      unreadCount: () => {
        return get().notifications.filter(n => !n.read).length;
      },
      
      // Actions
      setUserEmail: (email) => {
        set({ userEmail: email });
        if (email) {
          const { currentMemberId, currentHomeId } = get();
          get().loadNotifications(email, currentMemberId || undefined, currentHomeId || undefined);
        } else {
          set({ notifications: [] });
        }
      },
      
      setCurrentMemberId: (memberId) => {
        set({ currentMemberId: memberId });
        if (memberId) {
          const { userEmail, currentHomeId } = get();
          get().loadNotifications(userEmail || undefined, memberId, currentHomeId || undefined);
        }
      },
      
      setCurrentHomeId: (homeId) => {
        set({ currentHomeId: homeId });
        if (homeId) {
          const { userEmail, currentMemberId } = get();
          get().loadNotifications(userEmail || undefined, currentMemberId || undefined, homeId);
        }
      },
      
      loadNotifications: async (email?: string, memberId?: number, homeId?: number) => {
        const targetEmail = email || get().userEmail;
        const targetMemberId = memberId || get().currentMemberId;
        const targetHomeId = homeId || get().currentHomeId;
        
        if (!targetEmail && !targetMemberId) {
          set({ notifications: [] });
          return;
        }
        
        set({ isLoading: true });
        try {
          const allNotifications: Notification[] = [];
          
          // Load invitations as notifications
          if (targetEmail) {
            const invitation = await db.getPendingInvitationByEmail(targetEmail);
            if (invitation) {
              allNotifications.push(invitationToNotification(invitation));
            }
          }
          
          // Load pending swap requests as notifications
          if (targetMemberId) {
            const swapRequests = await db.getPendingSwapRequests(targetMemberId);
            for (const request of swapRequests) {
              allNotifications.push(swapRequestToNotification(request as unknown as SwapRequestWithDetails));
            }
          }
          
          // Load home alerts (inconvenience notifications)
          if (targetHomeId && targetMemberId) {
            const homeAlerts = await db.getUnreadHomeAlerts(targetHomeId, targetMemberId);
            for (const alert of homeAlerts) {
              allNotifications.push(homeAlertToNotification(alert as HomeAlert));
            }
          }
          
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
      
      markAlertAsRead: async (alertId: number) => {
        const { currentMemberId } = get();
        if (!currentMemberId) return;
        
        try {
          await db.markAlertAsRead(alertId, currentMemberId);
          // Remove from notifications list
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== `alert-${alertId}`)
          }));
        } catch (error) {
          console.error('Error marking alert as read:', error);
        }
      },
      
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        }));
      },
      
      clearNotifications: () => {
        set({ notifications: [], userEmail: null, currentMemberId: null });
      }
    }),
    { name: 'NotificationStore' }
  )
);
