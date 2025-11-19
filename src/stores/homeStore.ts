import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from '../lib/db';
import type { Home } from '../lib/types';
import { toast } from 'sonner';

interface HomeState {
  // State
  currentHome: Home | null;
  isLoadingHome: boolean;
  
  // Actions
  setHome: (home: Home | null) => void;
  loadHomeData: (userId: string) => Promise<void>;
  clearHomeData: () => void;
}

export const useHomeStore = create<HomeState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentHome: null,
      isLoadingHome: false,
      
      // Actions
      setHome: (home) => set({ currentHome: home }),
      
      loadHomeData: async (userId: string) => {
        set({ isLoadingHome: true });
        try {
          const homes = await db.getHomesByUser(userId);
          
          if (homes && homes.length > 0) {
            const home = homes[0];
            set({ currentHome: home });
            
            // Load member data in membersStore
            const { useMembersStore } = await import('./membersStore');
            const membersStore = useMembersStore.getState();
            await membersStore.loadCurrentMember(home.id, userId);
            await membersStore.loadMembers(home.id);
          } else {
            set({ currentHome: null });
            
            // Clear member data
            const { useMembersStore } = await import('./membersStore');
            const membersStore = useMembersStore.getState();
            membersStore.clearCurrentMember();
          }
        } catch (error) {
          console.error('Error loading home data:', error);
          toast.error('Error al cargar datos del hogar');
        } finally {
          set({ isLoadingHome: false });
        }
      },
      
      clearHomeData: () => {
        set({ currentHome: null });
        
        // Also clear member data
        import('./membersStore').then(({ useMembersStore }) => {
          useMembersStore.getState().clearCurrentMember();
        });
      }
    }),
    { name: 'HomeStore' }
  )
);
