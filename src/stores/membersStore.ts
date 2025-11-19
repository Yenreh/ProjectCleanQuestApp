import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from '../lib/db';
import { toast } from 'sonner';
import type { HomeMember, MemberRole } from '../lib/types';
import { useMasteryStore } from './masteryStore';

interface MembersState {
  // ═══════════════════════════════════════
  // CURRENT MEMBER (from homeStore)
  // ═══════════════════════════════════════
  currentMember: HomeMember | null;
  isLoadingCurrent: boolean;
  
  // ═══════════════════════════════════════
  // ALL MEMBERS (from homeManagementStore)
  // ═══════════════════════════════════════
  members: HomeMember[];
  isLoadingMembers: boolean;
  
  // ═══════════════════════════════════════
  // PROFILE EDIT FORM (from profileSettingsStore)
  // ═══════════════════════════════════════
  profileName: string;
  profileEmail: string;
  isSavingProfile: boolean;
  
  // Security (password change)
  showPassword: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  isChangingPassword: boolean;
  
  // Preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  isSavingPreferences: boolean;
  
  // ═══════════════════════════════════════
  // MEMBER MANAGEMENT (from homeManagementStore)
  // ═══════════════════════════════════════
  editingMember: HomeMember | null;
  editMemberRole: MemberRole;
  memberToRemove: HomeMember | null;
  // showRemoveConfirm moved to uiStore (UI boolean)
  
  // ═══════════════════════════════════════
  // CURRENT MEMBER ACTIONS
  // ═══════════════════════════════════════
  setCurrentMember: (member: HomeMember | null) => void;
  loadCurrentMember: (homeId: number, userId: string) => Promise<void>;
  updateCurrentMember: (memberId: number, updates: Partial<HomeMember>) => Promise<void>;
  clearCurrentMember: () => void;
  
  // ═══════════════════════════════════════
  // ALL MEMBERS ACTIONS
  // ═══════════════════════════════════════
  loadMembers: (homeId: number) => Promise<void>;
  
  // ═══════════════════════════════════════
  // PROFILE MANAGEMENT ACTIONS
  // ═══════════════════════════════════════
  setProfileName: (name: string) => void;
  setProfileEmail: (email: string) => void;
  setShowPassword: (show: boolean) => void;
  setCurrentPassword: (password: string) => void;
  setNewPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  setEmailNotifications: (enabled: boolean) => void;
  setPushNotifications: (enabled: boolean) => void;
  setWeeklyReports: (enabled: boolean) => void;
  
  initializeProfile: (member: HomeMember) => void;
  updateProfile: (memberId: number) => Promise<void>;
  changePassword: (memberId: number) => Promise<void>;
  updatePreferences: () => Promise<void>;
  
  // ═══════════════════════════════════════
  // MEMBER MANAGEMENT ACTIONS
  // ═══════════════════════════════════════
  setEditingMember: (member: HomeMember | null) => void;
  setEditMemberRole: (role: MemberRole) => void;
  setMemberToRemove: (member: HomeMember | null) => void;
  // setShowRemoveConfirm moved to uiStore
  startEditMember: (member: HomeMember) => void;
  updateMemberRole: (memberId: number, onSuccess: () => void) => Promise<void>;
  removeMember: (memberId: number, onSuccess: () => void) => Promise<void>;
}

export const useMembersStore = create<MembersState>()(
  devtools(
    (set, get) => ({
      // ═══════════════════════════════════════
      // INITIAL STATE
      // ═══════════════════════════════════════
      // Current member
      currentMember: null,
      isLoadingCurrent: false,
      
      // All members
      members: [],
      isLoadingMembers: false,
      
      // Profile form
      profileName: "",
      profileEmail: "",
      isSavingProfile: false,
      
      // Security
      showPassword: false,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      isChangingPassword: false,
      
      // Preferences
      emailNotifications: true,
      pushNotifications: true,
      weeklyReports: true,
      isSavingPreferences: false,
      
      // Member management
      editingMember: null,
      editMemberRole: "member",
      memberToRemove: null,
      // showRemoveConfirm moved to uiStore
      
      // ═══════════════════════════════════════
      // CURRENT MEMBER ACTIONS
      // ═══════════════════════════════════════
      setCurrentMember: (member) => {
        set({ currentMember: member });
        
        // Initialize mastery level if member exists
        if (member?.mastery_level) {
          const masteryStore = useMasteryStore.getState();
          masteryStore.setMasteryLevel(member.mastery_level as any);
        }
      },
      
      loadCurrentMember: async (homeId: number, userId: string) => {
        set({ isLoadingCurrent: true });
        try {
          const member = await db.getCurrentMember(homeId, userId);
          if (member) {
            get().setCurrentMember(member);
          } else {
            set({ currentMember: null });
          }
        } catch (error) {
          console.error('Error loading current member:', error);
          toast.error('Error al cargar datos del miembro');
        } finally {
          set({ isLoadingCurrent: false });
        }
      },
      
      updateCurrentMember: async (memberId: number, updates: Partial<HomeMember>) => {
        try {
          const updatedMember = await db.updateMember(memberId, updates);
          set({ currentMember: updatedMember });
        } catch (error) {
          console.error('Error updating member:', error);
          toast.error('Error al actualizar miembro');
          throw error;
        }
      },
      
      clearCurrentMember: () => {
        set({ currentMember: null });
      },
      
      // ═══════════════════════════════════════
      // ALL MEMBERS ACTIONS
      // ═══════════════════════════════════════
      loadMembers: async (homeId: number) => {
        set({ isLoadingMembers: true });
        try {
          const membersData = await db.getHomeMembers(homeId);
          set({ members: membersData });
        } catch (error) {
          console.error('Error loading members:', error);
          toast.error('Error al cargar miembros');
        } finally {
          set({ isLoadingMembers: false });
        }
      },
      
      // ═══════════════════════════════════════
      // PROFILE MANAGEMENT ACTIONS
      // ═══════════════════════════════════════
      setProfileName: (name) => set({ profileName: name }),
      
      setProfileEmail: (email) => set({ profileEmail: email }),
      
      setShowPassword: (show) => set({ showPassword: show }),
      
      setCurrentPassword: (password) => set({ currentPassword: password }),
      
      setNewPassword: (password) => set({ newPassword: password }),
      
      setConfirmPassword: (password) => set({ confirmPassword: password }),
      
      setEmailNotifications: (enabled) => set({ emailNotifications: enabled }),
      
      setPushNotifications: (enabled) => set({ pushNotifications: enabled }),
      
      setWeeklyReports: (enabled) => set({ weeklyReports: enabled }),
      
      initializeProfile: (member: HomeMember) => {
        set({
          profileName: member.full_name || "",
          profileEmail: member.email || ""
        });
      },
      
      updateProfile: async (memberId: number) => {
        const { profileName, profileEmail } = get();
        
        if (!profileName.trim()) {
          toast.error("El nombre no puede estar vacío");
          throw new Error("El nombre no puede estar vacío");
        }
        
        const prevName = profileName;
        const prevEmail = profileEmail;
        
        set({ isSavingProfile: true });
        
        try {
          await db.updateMemberProfile(memberId, profileName.trim(), profileEmail.trim());
          toast.success("Perfil actualizado correctamente");
          
          // Update currentMember if this is the profile of the current user
          const { currentMember } = get();
          if (currentMember && currentMember.id === memberId) {
            set({
              currentMember: {
                ...currentMember,
                full_name: profileName.trim(),
                email: profileEmail.trim()
              }
            });
          }
        } catch (error: any) {
          console.error('Error updating profile:', error);
          toast.error(error.message || "Error al actualizar perfil");
          // Rollback
          set({ profileName: prevName, profileEmail: prevEmail });
          throw error;
        } finally {
          set({ isSavingProfile: false });
        }
      },
      
      changePassword: async (memberId: number) => {
        const { currentPassword, newPassword, confirmPassword } = get();
        
        if (!currentPassword || !newPassword || !confirmPassword) {
          toast.error("Completa todos los campos");
          throw new Error("Completa todos los campos");
        }
        
        if (newPassword !== confirmPassword) {
          toast.error("Las contraseñas no coinciden");
          throw new Error("Las contraseñas no coinciden");
        }
        
        if (newPassword.length < 6) {
          toast.error("La contraseña debe tener al menos 6 caracteres");
          throw new Error("La contraseña debe tener al menos 6 caracteres");
        }
        
        set({ isChangingPassword: true });
        
        try {
          await db.changePassword(currentPassword, newPassword);
          toast.success("Contraseña actualizada correctamente");
          
          // Clear password fields
          set({
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });
        } catch (error: any) {
          console.error('Error changing password:', error);
          toast.error(error.message || "Error al cambiar contraseña");
          throw error;
        } finally {
          set({ isChangingPassword: false });
        }
      },
      
      updatePreferences: async () => {
        set({ isSavingPreferences: true });
        
        try {
          // TODO: Implement actual save when backend is ready
          toast.info("Función en desarrollo");
        } catch (error) {
          console.error('Error updating preferences:', error);
          toast.error("Error al actualizar preferencias");
          throw error;
        } finally {
          set({ isSavingPreferences: false });
        }
      },
      
      // ═══════════════════════════════════════
      // MEMBER MANAGEMENT ACTIONS
      // ═══════════════════════════════════════
      setEditingMember: (member) => set({ editingMember: member }),
      
      setEditMemberRole: (role) => set({ editMemberRole: role }),
      
      setMemberToRemove: (member) => set({ memberToRemove: member }),
      
      // setShowRemoveConfirm moved to uiStore
      
      startEditMember: (member: HomeMember) => {
        set({
          editingMember: member,
          editMemberRole: member.role
        });
      },
      
      updateMemberRole: async (memberId: number, onSuccess: () => void) => {
        const { editMemberRole, members } = get();
        
        set({ isLoadingMembers: true });
        try {
          await db.updateMemberRole(memberId, editMemberRole);
          
          // Update local state
          set({
            members: members.map(m => m.id === memberId ? { ...m, role: editMemberRole } : m),
            editingMember: null
          });
          
          toast.success("Rol actualizado correctamente");
          onSuccess();
        } catch (error: any) {
          console.error('Error updating role:', error);
          toast.error(error.message || "Error al actualizar rol");
        } finally {
          set({ isLoadingMembers: false });
        }
      },
      
      removeMember: async (memberId: number, onSuccess: () => void) => {
        const { members } = get();
        
        set({ isLoadingMembers: true });
        try {
          await db.removeMember(memberId);
          
          // Update local state
          set({
            members: members.filter(m => m.id !== memberId),
            memberToRemove: null
          });
          // showRemoveConfirm closing moved to uiStore - component should call useUIStore().setShowRemoveConfirm(false)
          
          toast.success("Miembro eliminado correctamente");
          onSuccess();
        } catch (error: any) {
          console.error('Error removing member:', error);
          toast.error(error.message || "Error al eliminar miembro");
        } finally {
          set({ isLoadingMembers: false });
        }
      }
    }),
    { name: 'MembersStore' }
  )
);
