import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from '../lib/db';
import { toast } from 'sonner';
import type { MasteryLevel } from '../lib/masteryService';

interface MasteryState {
  // State
  masteryLevel: MasteryLevel;
  isUpdating: boolean;
  
  // Actions
  setMasteryLevel: (level: MasteryLevel) => void;
  loadMasteryLevel: (memberId: number) => Promise<void>;
  updateMasteryLevel: (memberId: number) => Promise<MasteryLevel | null>;
  showLevelUpToast: (newLevel: MasteryLevel) => void;
}

const levelNames: Record<MasteryLevel, string> = {
  'novice': 'Novato',
  'solver': 'Solucionador',
  'expert': 'Experto',
  'master': 'Maestro',
  'visionary': 'Visionario'
};

export const useMasteryStore = create<MasteryState>()(
  devtools(
    (set, get) => ({
      // Initial state
      masteryLevel: 'novice',
      isUpdating: false,
      
      // Actions
      setMasteryLevel: (level) => set({ masteryLevel: level }),
      
      loadMasteryLevel: async (memberId: number) => {
        // This method is primarily for initialization from external sources
        // In practice, the level should be set via setMasteryLevel when loading member data
        // from homeStore or other stores that have member information
      },
      
      updateMasteryLevel: async (memberId: number) => {
        const { showLevelUpToast } = get();
        
        set({ isUpdating: true });
        
        try {
          // Update weeks active
          await db.updateWeeksActive(memberId);
          
          // Check for level up
          const newLevel = await db.updateMasteryLevel(memberId);
          
          if (newLevel) {
            set({ masteryLevel: newLevel as MasteryLevel });
            
            // Show level up toast
            showLevelUpToast(newLevel as MasteryLevel);
            
            return newLevel as MasteryLevel;
          }
          
          return null;
        } catch (error) {
          console.error('Error updating mastery level:', error);
          return null;
        } finally {
          set({ isUpdating: false });
        }
      },
      
      showLevelUpToast: (newLevel: MasteryLevel) => {
        toast.success(`🎉 ¡Subiste de nivel a ${levelNames[newLevel]}!`, {
          description: 'Ahora tienes acceso a nuevas funciones',
          duration: 4000,
        });
      }
    }),
    { name: 'MasteryStore' }
  )
);
