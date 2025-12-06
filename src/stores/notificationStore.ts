import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from '../lib/db';
import { Notification, InvitationNotification, SwapRequestNotification } from '../lib/notifications';
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

// Función para convertir una solicitud de intercambio a notificación
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

interface NotificationState {
  // State
  notifications: Notification[];
  isLoading: boolean;
  userEmail: string | null;
  currentMemberId: number | null;
  
  // Computed
  unreadCount: () => number;
  
  // Actions
  setUserEmail: (email: string | null) => void;
  setCurrentMemberId: (memberId: number | null) => void;
  loadNotifications: (email?: string, memberId?: number) => Promise<void>;
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
      currentMemberId: null,
      
      // Computed
      unreadCount: () => {
        return get().notifications.filter(n => !n.read).length;
      },
      
      // Actions
      setUserEmail: (email) => {
        set({ userEmail: email });
        if (email) {
          get().loadNotifications(email, get().currentMemberId || undefined);
        } else {
          set({ notifications: [] });
        }
      },
      
      setCurrentMemberId: (memberId) => {
        set({ currentMemberId: memberId });
        if (memberId) {
          get().loadNotifications(get().userEmail || undefined, memberId);
        }
      },
      
      loadNotifications: async (email?: string, memberId?: number) => {
        const targetEmail = email || get().userEmail;
        const targetMemberId = memberId || get().currentMemberId;
        
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
              allNotifications.push(swapRequestToNotification(request as SwapRequestWithDetails));
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
