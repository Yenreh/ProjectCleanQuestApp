import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from '../lib/db';
import { toast } from 'sonner';
import type { Achievement } from '../lib/types';

interface AchievementsState {
  // Data
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  
  // Loading
  isLoading: boolean;
  
  // Actions
  loadAchievements: (memberId: number) => Promise<void>;
  checkAndUnlock: (memberId: number) => Promise<Achievement[]>;
  showUnlockToast: (achievement: Achievement) => void;
  showUnlockToasts: (achievements: Achievement[]) => void;
  clearUnlocked: () => void;
}

export const useAchievementsStore = create<AchievementsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      achievements: [],
      unlockedAchievements: [],
      isLoading: false,
      
      // Actions
      loadAchievements: async (memberId: number) => {
        set({ isLoading: true });
        try {
          const memberAchievements = await db.getMemberAchievements(memberId);
          set({ achievements: memberAchievements });
        } catch (error) {
          console.error('Error loading achievements:', error);
          toast.error('Error al cargar logros');
        } finally {
          set({ isLoading: false });
        }
      },
      
      checkAndUnlock: async (memberId: number) => {
        try {
          const newAchievements = await db.checkAndUnlockAchievements(memberId);
          
          if (newAchievements.length > 0) {
            set({ unlockedAchievements: newAchievements });
            get().showUnlockToasts(newAchievements);
            
            // Reload achievements list to include newly unlocked ones
            await get().loadAchievements(memberId);
          }
          
          return newAchievements;
        } catch (error) {
          console.error('Error checking achievements:', error);
          return [];
        }
      },
      
      showUnlockToast: (achievement: Achievement) => {
        toast.success(`🏆 ¡Insignia desbloqueada: ${achievement.title}!`, {
          description: achievement.description,
          duration: 5000,
        });
      },
      
      showUnlockToasts: (achievements: Achievement[]) => {
        // Stagger toasts so they don't all appear at once
        achievements.forEach((achievement, index) => {
          setTimeout(() => {
            get().showUnlockToast(achievement);
          }, index * 1500);
        });
      },
      
      clearUnlocked: () => {
        set({ unlockedAchievements: [] });
      }
    }),
    { name: 'AchievementsStore' }
  )
);
