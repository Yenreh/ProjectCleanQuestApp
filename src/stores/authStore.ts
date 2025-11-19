import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { db } from '../lib/db';
import type { Profile } from '../lib/types';
import { toast } from 'sonner';

interface AuthState {
  // State
  currentUser: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: Profile | null) => void;
  setAuthenticated: (isAuth: boolean) => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentUser: null,
        isAuthenticated: false,
        isLoading: true,
        
        // Actions
        setUser: (user) => set({ currentUser: user }),
        
        setAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
        
        setLoading: (loading) => set({ isLoading: loading }),
        
        checkAuth: async () => {
          set({ isLoading: true });
          try {
            const user = await db.getCurrentUser();
            
            if (user) {
              const profile = await db.getProfile(user.id);
              set({
                currentUser: profile,
                isAuthenticated: true,
                isLoading: false
              });
            } else {
              set({
                currentUser: null,
                isAuthenticated: false,
                isLoading: false
              });
            }
          } catch (error) {
            console.error('Error checking auth:', error);
            set({
              currentUser: null,
              isAuthenticated: false,
              isLoading: false
            });
          }
        },
        
        signIn: async (email: string, password: string) => {
          try {
            await db.signIn(email, password);
            const user = await db.getCurrentUser();
            
            if (user) {
              const profile = await db.getProfile(user.id);
              set({
                currentUser: profile,
                isAuthenticated: true
              });
              toast.success('¡Bienvenido de vuelta!');
            }
          } catch (error: any) {
            console.error('Error signing in:', error);
            toast.error(error.message || 'Error al iniciar sesión');
            throw error;
          }
        },
        
        signUp: async (email: string, password: string, fullName: string) => {
          try {
            await db.signUp(email, password, fullName);
            const user = await db.getCurrentUser();
            
            if (user) {
              const profile = await db.getProfile(user.id);
              set({
                currentUser: profile,
                isAuthenticated: true
              });
              toast.success('¡Cuenta creada exitosamente!');
            }
          } catch (error: any) {
            console.error('Error signing up:', error);
            toast.error(error.message || 'Error al crear cuenta');
            throw error;
          }
        },
        
        signOut: async () => {
          try {
            await db.signOut();
            set({
              currentUser: null,
              isAuthenticated: false
            });
            toast.success('Sesión cerrada correctamente');
          } catch (error: any) {
            console.error('Error signing out:', error);
            toast.error('Error al cerrar sesión');
            throw error;
          }
        },
        
        updateUserProfile: async (updates: Partial<Profile>) => {
          const { currentUser } = get();
          if (!currentUser) return;
          
          try {
            const updatedProfile = await db.updateProfile(currentUser.id, updates);
            set({ currentUser: updatedProfile });
            toast.success('Perfil actualizado');
          } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error('Error al actualizar perfil');
            throw error;
          }
        }
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          currentUser: state.currentUser,
          isAuthenticated: state.isAuthenticated
        })
      }
    ),
    { name: 'AuthStore' }
  )
);
