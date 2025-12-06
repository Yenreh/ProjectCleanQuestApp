import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from '../lib/db';
import { toast } from 'sonner';
import type { MemberRole } from '../lib/types';

interface ChangeHomeData {
  invitationId: string;
  token: string;
  currentHomeName: string | null;
  currentHomeOwner?: string;
  newHomeName: string;
  newHomeOwner?: string;
}

interface InvitationState {
  // ═══════════════════════════════════════
  // ACCEPTING INVITATIONS (original functionality)
  // ═══════════════════════════════════════
  invitationToken: string | null;
  changeHomeData: ChangeHomeData | null;
  showChangeHomeDialog: boolean;
  isProcessing: boolean;
  
  // ═══════════════════════════════════════
  // MANAGING INVITATIONS (from homeManagementStore)
  // ═══════════════════════════════════════
  activeInvitations: any[];
  loadingInvitations: boolean;
  
  // Invite form state
  showInviteForm: boolean;
  inviteEmail: string;
  inviteRole: MemberRole;
  
  // ═══════════════════════════════════════
  // ACCEPTING INVITATIONS ACTIONS
  // ═══════════════════════════════════════
  setInvitationToken: (token: string | null) => void;
  setChangeHomeData: (data: ChangeHomeData | null) => void;
  setShowChangeHomeDialog: (show: boolean) => void;
  processInvitation: (token: string, userId: string) => Promise<void>;
  acceptHomeChange: (userId: string) => Promise<void>;
  declineHomeChange: (currentHomeName: string | null) => Promise<void>;
  checkUrlForInvitation: () => void;
  checkPendingInvitationByEmail: (email: string) => Promise<void>;
  clearInvitationData: () => void;
  
  // ═══════════════════════════════════════
  // MANAGING INVITATIONS ACTIONS
  // ═══════════════════════════════════════
  loadInvitations: (homeId: number) => Promise<void>;
  setShowInviteForm: (show: boolean) => void;
  setInviteEmail: (email: string) => void;
  setInviteRole: (role: MemberRole) => void;
  resetInviteForm: () => void;
  sendInvite: (homeId: number, onSuccess: () => void) => Promise<void>;
  revokeInvitation: (token: string, homeId: number) => Promise<void>;
  copyInvitationToken: (token: string) => Promise<void>;
}

export const useInvitationStore = create<InvitationState>()(
  devtools(
    (set, get) => ({
      // ═══════════════════════════════════════
      // INITIAL STATE
      // ═══════════════════════════════════════
      // Accepting invitations
      invitationToken: null,
      changeHomeData: null,
      showChangeHomeDialog: false,
      isProcessing: false,
      
      // Managing invitations
      activeInvitations: [],
      loadingInvitations: false,
      showInviteForm: false,
      inviteEmail: "",
      inviteRole: "member",
      
      // ═══════════════════════════════════════
      // ACCEPTING INVITATIONS ACTIONS
      // ═══════════════════════════════════════
      setInvitationToken: (token) => set({ invitationToken: token }),
      
      setChangeHomeData: (data) => set({ changeHomeData: data }),
      
      setShowChangeHomeDialog: (show) => set({ showChangeHomeDialog: show }),
      
      processInvitation: async (token: string, userId: string) => {
        set({ isProcessing: true });
        try {
          await db.acceptInvitation(token, userId);
          toast.success('¡Te has unido al hogar!');
          
          // Clear invitation data
          get().clearInvitationData();
        } catch (error: any) {
          console.error('Error processing invitation:', error);
          toast.error(error.message || 'Error al procesar la invitación');
          throw error;
        } finally {
          set({ isProcessing: false });
        }
      },
      
      acceptHomeChange: async (userId: string) => {
        const { changeHomeData } = get();
        if (!changeHomeData) return;
        
        set({ isProcessing: true });
        try {
          await db.changeHome(userId, changeHomeData.token);
          toast.success(`Te has cambiado a ${changeHomeData.newHomeName}`);
          
          // Clear invitation data
          get().clearInvitationData();
        } catch (error: any) {
          console.error('Error accepting home change:', error);
          toast.error(error.message || 'Error al cambiar de hogar');
          throw error;
        } finally {
          set({ isProcessing: false, showChangeHomeDialog: false });
        }
      },
      
      declineHomeChange: async (currentHomeName: string | null) => {
        const { changeHomeData } = get();
        if (!changeHomeData) return;
        
        try {
          // Cancel the invitation in the database
          await db.cancelInvitation(changeHomeData.invitationId);
          toast.info('Invitación rechazada');
          
          // Clear invitation data
          get().clearInvitationData();
        } catch (error: any) {
          console.error('Error declining invitation:', error);
          toast.error('Error al rechazar la invitación');
        }
      },
      
      checkUrlForInvitation: () => {
        // La comprobación de invitaciones pendientes se hace desde la base de datos
        // cuando el usuario no tiene casa
      },
      
      checkPendingInvitationByEmail: async (email: string) => {
        try {
          const emailInvitation = await db.getPendingInvitationByEmail(email);
          if (emailInvitation && emailInvitation.invitation_token) {
            // Get owner name from the home profile data
            const ownerName = emailInvitation.homes?.profiles?.full_name || 
                            emailInvitation.homes?.profiles?.email || 
                            'Desconocido';
            
            set({
              changeHomeData: {
                invitationId: emailInvitation.id,
                token: emailInvitation.invitation_token,
                currentHomeName: null,
                currentHomeOwner: undefined,
                newHomeName: emailInvitation.homes?.name || 'Desconocido',
                newHomeOwner: ownerName
              },
              showChangeHomeDialog: true
            });
          }
        } catch (error) {
          console.error('Error checking pending invitations:', error);
        }
      },
      
      clearInvitationData: () => {
        set({
          invitationToken: null,
          changeHomeData: null,
          showChangeHomeDialog: false,
          isProcessing: false
        });
      },
      
      // ═══════════════════════════════════════
      // MANAGING INVITATIONS ACTIONS
      // ═══════════════════════════════════════
      loadInvitations: async (homeId: number) => {
        set({ loadingInvitations: true });
        try {
          const invitations = await db.getActiveInvitations(homeId.toString());
          set({ activeInvitations: invitations });
        } catch (error) {
          console.error('Error loading invitations:', error);
          toast.error("Error al cargar invitaciones");
        } finally {
          set({ loadingInvitations: false });
        }
      },
      
      setShowInviteForm: (show) => set({ showInviteForm: show }),
      
      setInviteEmail: (email) => set({ inviteEmail: email }),
      
      setInviteRole: (role) => set({ inviteRole: role }),
      
      resetInviteForm: () => {
        set({
          showInviteForm: false,
          inviteEmail: "",
          inviteRole: "member"
        });
      },
      
      sendInvite: async (homeId: number, onSuccess: () => void) => {
        const { inviteEmail, inviteRole } = get();
        
        if (!inviteEmail.trim()) {
          toast.error("El email es requerido");
          return;
        }

        set({ isProcessing: true });
        try {
          const result = await db.inviteMember(homeId, {
            email: inviteEmail.trim(),
            role: inviteRole
          });
          
          toast.success(`Invitación enviada a ${inviteEmail}`);
          get().resetInviteForm();
          await get().loadInvitations(homeId);
          onSuccess();
        } catch (error: any) {
          console.error('Error sending invite:', error);
          toast.error(error.message || "Error al enviar invitación");
        } finally {
          set({ isProcessing: false });
        }
      },
      
      revokeInvitation: async (token: string, homeId: number) => {
        set({ loadingInvitations: true });
        try {
          // Find the invitation by token
          const invitations = await db.getActiveInvitations(homeId.toString());
          const invitation = invitations.find((inv: any) => inv.invitation_token === token);
          
          if (invitation) {
            await db.cancelInvitation(invitation.id.toString());
            toast.success("Invitación revocada");
            await get().loadInvitations(homeId);
          } else {
            toast.error("Invitación no encontrada");
          }
        } catch (error: any) {
          console.error('Error revoking invitation:', error);
          toast.error("Error al revocar invitación");
        } finally {
          set({ loadingInvitations: false });
        }
      },
      
      copyInvitationToken: async (token: string) => {
        try {
          if (!token) {
            toast.error("Token no disponible");
            return;
          }
          await navigator.clipboard.writeText(token);
          toast.success("Token copiado al portapapeles");
        } catch (error: any) {
          console.error('Error copying token:', error);
          toast.error("Error al copiar el token");
        }
      }
    }),
    { name: 'InvitationStore' }
  )
);

