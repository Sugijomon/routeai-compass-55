import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserProgress, TrainingProgress } from '@/types';
import { mockUsers, mockUserProgress } from '@/data/mockUsers';

interface AppState {
  // Current user simulation
  currentUserId: string;
  currentRole: 'user' | 'org_admin';
  
  // Data
  users: User[];
  userProgress: UserProgress[];
  
  // Actions
  setCurrentUser: (userId: string) => void;
  setCurrentRole: (role: 'user' | 'org_admin') => void;
  getCurrentUser: () => User | undefined;
  getCurrentUserProgress: () => UserProgress | undefined;
  
  // Training progress
  completeModule: (moduleId: string) => void;
  recordAssessment: (score: number) => void;
  
  // License management (for org admins)
  issueLicense: (userId: string, capabilities: string[], score: number) => void;
  revokeLicense: (userId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUserId: 'user-1',
      currentRole: 'user',
      users: mockUsers,
      userProgress: mockUserProgress,
      
      setCurrentUser: (userId) => {
        const user = get().users.find(u => u.id === userId);
        if (user) {
          set({ currentUserId: userId, currentRole: user.role });
        }
      },
      
      setCurrentRole: (role) => {
        set({ currentRole: role });
        // Also update the user's role in the users array
        const userId = get().currentUserId;
        set(state => ({
          users: state.users.map(u => 
            u.id === userId ? { ...u, role } : u
          )
        }));
      },
      
      getCurrentUser: () => {
        const { users, currentUserId } = get();
        return users.find(u => u.id === currentUserId);
      },
      
      getCurrentUserProgress: () => {
        const { userProgress, currentUserId } = get();
        return userProgress.find(p => p.userId === currentUserId);
      },
      
      completeModule: (moduleId) => {
        const { currentUserId, userProgress } = get();
        const existingProgress = userProgress.find(p => p.userId === currentUserId);
        
        if (existingProgress) {
          set(state => ({
            userProgress: state.userProgress.map(p => {
              if (p.userId !== currentUserId) return p;
              
              const updatedTraining = p.trainingProgress.map(tp =>
                tp.moduleId === moduleId
                  ? { ...tp, completed: true, completedAt: new Date().toISOString() }
                  : tp
              );
              
              // Add module if not exists
              if (!updatedTraining.find(tp => tp.moduleId === moduleId)) {
                updatedTraining.push({
                  moduleId,
                  completed: true,
                  completedAt: new Date().toISOString(),
                });
              }
              
              return { ...p, trainingProgress: updatedTraining };
            })
          }));
        } else {
          // Create new progress entry
          set(state => ({
            userProgress: [
              ...state.userProgress,
              {
                userId: currentUserId,
                trainingProgress: [{
                  moduleId,
                  completed: true,
                  completedAt: new Date().toISOString(),
                }],
                assessmentAttempts: 0,
              }
            ]
          }));
        }
      },
      
      recordAssessment: (score) => {
        const { currentUserId } = get();
        
        set(state => ({
          userProgress: state.userProgress.map(p => {
            if (p.userId !== currentUserId) return p;
            return {
              ...p,
              assessmentAttempts: p.assessmentAttempts + 1,
              lastAssessmentScore: score,
              lastAssessmentAt: new Date().toISOString(),
            };
          })
        }));
        
        // If passed (75%+), issue license
        if (score >= 75) {
          const baseCapabilities = [
            'cap-text-summary',
            'cap-text-rewrite',
            'cap-ideation',
            'cap-draft-creation',
            'cap-translation',
          ];
          
          // Add more capabilities based on score
          if (score >= 85) {
            baseCapabilities.push('cap-data-analysis', 'cap-research');
          }
          if (score >= 95) {
            baseCapabilities.push('cap-code-assistance');
          }
          
          get().issueLicense(currentUserId, baseCapabilities, score);
        }
      },
      
      issueLicense: (userId, capabilities, score) => {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
        const certNumber = `RAI-${now.getFullYear()}-${String(get().users.filter(u => u.license).length + 1).padStart(3, '0')}`;
        
        set(state => ({
          users: state.users.map(u => {
            if (u.id !== userId) return u;
            return {
              ...u,
              license: {
                certificateNumber: certNumber,
                userId,
                status: 'active',
                assessmentScore: score,
                completedAt: now.toISOString(),
                grantedCapabilities: capabilities,
                issuedAt: now.toISOString(),
                expiresAt: expiresAt.toISOString(),
                issuedBy: 'RouteAI Systeem',
              }
            };
          })
        }));
      },
      
      revokeLicense: (userId) => {
        set(state => ({
          users: state.users.map(u => {
            if (u.id !== userId) return u;
            return { ...u, license: null };
          })
        }));
      },
    }),
    {
      name: 'routeai-storage',
    }
  )
);
