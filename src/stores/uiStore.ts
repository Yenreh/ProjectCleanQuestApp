import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type Screen = 'home' | 'progress' | 'challenges' | 'harmony' | 'onboarding' | 'auth';

interface UIState {
  // Screen navigation
  currentScreen: Screen;
  
  // Main Modals/Dialogs
  profileSettingsOpen: boolean;
  homeManagementOpen: boolean;
  generalSettingsOpen: boolean;
  notificationsDialogOpen: boolean;
  
  // Settings Dialogs
  statisticsOpen: boolean;
  nextCycleOpen: boolean;
  
  // Assignment Dialogs
  taskDialogOpen: boolean;
  swapModalOpen: boolean;
  cancelDialogOpen: boolean;
  availableTasksOpen: boolean;
  
  // Member Management Dialogs
  showRemoveConfirm: boolean;
  
  // Home Management Forms
  showTaskForm: boolean;
  showSteps: boolean;
  showZoneForm: boolean;
  
  // Invitation Dialogs
  showChangeHomeDialog: boolean;
  showInviteForm: boolean;  // Phase 4: Moved from invitationStore
  
  // Actions
  setCurrentScreen: (screen: Screen) => void;
  
  // Main Dialogs
  setProfileSettingsOpen: (open: boolean) => void;
  setHomeManagementOpen: (open: boolean) => void;
  setGeneralSettingsOpen: (open: boolean) => void;
  setNotificationsDialogOpen: (open: boolean) => void;
  
  // Settings Dialogs
  setStatisticsOpen: (open: boolean) => void;
  setNextCycleOpen: (open: boolean) => void;
  
  // Assignment Dialogs
  setTaskDialogOpen: (open: boolean) => void;
  setSwapModalOpen: (open: boolean) => void;
  setCancelDialogOpen: (open: boolean) => void;
  setAvailableTasksOpen: (open: boolean) => void;
  
  // Member Management Dialogs
  setShowRemoveConfirm: (open: boolean) => void;
  
  // Home Management Forms
  setShowTaskForm: (open: boolean) => void;
  setShowSteps: (open: boolean) => void;
  setShowZoneForm: (open: boolean) => void;
  
  // Invitation Dialogs
  setShowChangeHomeDialog: (open: boolean) => void;
  setShowInviteForm: (open: boolean) => void;  // Phase 4: Moved from invitationStore
  
  closeAllDialogs: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  currentScreen: 'auth',
  
  // Main Dialogs
  profileSettingsOpen: false,
  homeManagementOpen: false,
  generalSettingsOpen: false,
  notificationsDialogOpen: false,
  
  // Settings Dialogs
  statisticsOpen: false,
  nextCycleOpen: false,
  
  // Assignment Dialogs
  taskDialogOpen: false,
  swapModalOpen: false,
  cancelDialogOpen: false,
  availableTasksOpen: false,
  
  // Member Management Dialogs
  showRemoveConfirm: false,
  
  // Home Management Forms
  showTaskForm: false,
  showSteps: false,
  showZoneForm: false,
  
  // Invitation Dialogs
  showChangeHomeDialog: false,
  showInviteForm: false,
  
  // Actions
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  
  // Main Dialogs
  setProfileSettingsOpen: (open) => set({ profileSettingsOpen: open }),
  setHomeManagementOpen: (open) => set({ homeManagementOpen: open }),
  setGeneralSettingsOpen: (open) => set({ generalSettingsOpen: open }),
  setNotificationsDialogOpen: (open) => set({ notificationsDialogOpen: open }),
  
  // Settings Dialogs
  setStatisticsOpen: (open) => set({ statisticsOpen: open }),
  setNextCycleOpen: (open) => set({ nextCycleOpen: open }),
  
  // Assignment Dialogs
  setTaskDialogOpen: (open) => set({ taskDialogOpen: open }),
  setSwapModalOpen: (open) => set({ swapModalOpen: open }),
  setCancelDialogOpen: (open) => set({ cancelDialogOpen: open }),
  setAvailableTasksOpen: (open) => set({ availableTasksOpen: open }),
  
  // Member Management Dialogs
  setShowRemoveConfirm: (open) => set({ showRemoveConfirm: open }),
  
  // Home Management Forms
  setShowTaskForm: (open) => set({ showTaskForm: open }),
  setShowSteps: (open) => set({ showSteps: open }),
  setShowZoneForm: (open) => set({ showZoneForm: open }),
  
  // Invitation Dialogs
  setShowChangeHomeDialog: (open) => set({ showChangeHomeDialog: open }),
  setShowInviteForm: (open) => set({ showInviteForm: open }),
  
  closeAllDialogs: () => set({
    profileSettingsOpen: false,
    homeManagementOpen: false,
    generalSettingsOpen: false,
    notificationsDialogOpen: false,
    statisticsOpen: false,
    nextCycleOpen: false,
    taskDialogOpen: false,
    swapModalOpen: false,
    cancelDialogOpen: false,
    availableTasksOpen: false,
    showRemoveConfirm: false,
    showTaskForm: false,
    showSteps: false,
    showZoneForm: false,
    showChangeHomeDialog: false,
    showInviteForm: false
  })
}));
