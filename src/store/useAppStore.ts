import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, BaseCapability, Tool } from '../types';
import { MOCK_USERS } from '../data/mockUsers';
import { BASE_CAPABILITIES, getDefaultCapabilities } from '../data/baseCapabilities';
import { MOCK_TOOLS } from '../data/mockTools';
import { TRAINING_MODULES, ASSESSMENT_QUESTIONS } from '../data/trainingData';

interface TrainingProgress {
  userId: string;
  completedModules: string[];
  currentModule: string | null;
  assessmentAttempts: number;
  lastAttemptScore: number | null;
}

interface AppState {
  // === AUTH SIMULATION ===
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // === MASTER DATA (read-only) ===
  capabilities: BaseCapability[];
  tools: Tool[];
  trainingModules: typeof TRAINING_MODULES;
  assessmentQuestions: typeof ASSESSMENT_QUESTIONS;

  // === TRAINING PROGRESS ===
  trainingProgress: TrainingProgress[];
  completeModule: (userId: string, moduleId: string) => void;
  startAssessment: (userId: string) => void;
  submitAssessment: (userId: string, score: number, answers: Record<string, string>[]) => void;

  // === AUTHORITY CHECKING ===
  userHasCapability: (userId: string, capabilityId: string) => boolean;
  getUserCapabilities: (userId: string) => BaseCapability[];
  checkUsageAuthority: (userId: string, usage: {
    purpose: string;
    dataType: string;
    automationLevel: string;
  }) => {
    allowed: boolean;
    reason: string;
    matchedCapability?: BaseCapability;
  };

  // === TOOL ACCESS ===
  getUserTools: (userId: string) => Tool[];
  canUserAccessTool: (userId: string, toolId: string) => {
    canAccess: boolean;
    reason: string;
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      capabilities: BASE_CAPABILITIES,
      tools: MOCK_TOOLS,
      trainingModules: TRAINING_MODULES,
      assessmentQuestions: ASSESSMENT_QUESTIONS,
      trainingProgress: [],

      // === AUTH ===
      setCurrentUser: (user) => {
        set({ currentUser: user });
      },

      // === TRAINING ===
      completeModule: (userId, moduleId) => {
        const progress = [...get().trainingProgress];
        let userProgress = progress.find(p => p.userId === userId);

        if (!userProgress) {
          userProgress = {
            userId,
            completedModules: [],
            currentModule: null,
            assessmentAttempts: 0,
            lastAttemptScore: null
          };
          progress.push(userProgress);
        }

        if (!userProgress.completedModules.includes(moduleId)) {
          userProgress.completedModules = [...userProgress.completedModules, moduleId];
        }

        set({ trainingProgress: progress });
      },

      startAssessment: (userId) => {
        const progress = [...get().trainingProgress];
        const userProgress = progress.find(p => p.userId === userId);

        if (userProgress) {
          userProgress.assessmentAttempts += 1;
        }

        set({ trainingProgress: progress });
      },

      submitAssessment: (userId, score, _answers) => {
        const progress = [...get().trainingProgress];
        const userProgress = progress.find(p => p.userId === userId);

        if (userProgress) {
          userProgress.lastAttemptScore = score;

          // Als geslaagd (>= 80%), update user license
          if (score >= 80) {
            const users = [...MOCK_USERS];
            const user = users.find(u => u.id === userId);

            if (user) {
              const now = new Date();
              const expires = new Date(now);
              expires.setFullYear(expires.getFullYear() + 1);

              user.license = {
                certificateNumber: `NL-${now.getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`,
                userId,
                status: 'active',
                assessmentScore: score,
                completedAt: now.toISOString(),
                grantedCapabilities: getDefaultCapabilities(), // EXPLICIET!
                issuedAt: now.toISOString(),
                expiresAt: expires.toISOString(),
                issuedBy: 'system'
              };

              // Update current user if this is them
              if (get().currentUser?.id === userId) {
                set({ currentUser: { ...user } });
              }
            }
          }
        }

        set({ trainingProgress: progress });
      },

      // === AUTHORITY CHECKING ===
      userHasCapability: (userId, capabilityId) => {
        const users = MOCK_USERS;
        const user = users.find(u => u.id === userId);

        if (!user?.license || user.license.status !== 'active') {
          return false;
        }

        return user.license.grantedCapabilities.includes(capabilityId);
      },

      getUserCapabilities: (userId) => {
        const users = MOCK_USERS;
        const user = users.find(u => u.id === userId);

        if (!user?.license || user.license.status !== 'active') {
          return [];
        }

        const allCapabilities = get().capabilities;
        return allCapabilities.filter(cap =>
          user.license!.grantedCapabilities.includes(cap.id)
        );
      },

      checkUsageAuthority: (userId, usage) => {
        const userCapabilities = get().getUserCapabilities(userId);

        if (userCapabilities.length === 0) {
          return {
            allowed: false,
            reason: 'Geen geldig AI-rijbewijs. Voltooi eerst de training.'
          };
        }

        // Check each capability to see if it matches
        for (const cap of userCapabilities) {
          const matchesAllowed =
            cap.allowedWhen.dataTypes.includes(usage.dataType) &&
            cap.allowedWhen.automationLevel.includes(usage.automationLevel);

          const violatesProhibited =
            cap.prohibitedWhen.dataTypes.includes(usage.dataType);

          if (matchesAllowed && !violatesProhibited) {
            return {
              allowed: true,
              reason: `Toegestaan onder capability "${cap.name}"`,
              matchedCapability: cap
            };
          }
        }

        return {
          allowed: false,
          reason: 'Gebruik valt buiten je huidige capabilities. RouteAI-beoordeling vereist.'
        };
      },

      // === TOOL ACCESS ===
      getUserTools: (userId) => {
        const users = MOCK_USERS;
        const user = users.find(u => u.id === userId);

        if (!user?.license || user.license.status !== 'active') {
          return [];
        }

        // Voor MVP: users met license krijgen toegang tot eerste 4 tools
        return get().tools.slice(0, 4);
      },

      canUserAccessTool: (userId, toolId) => {
        const users = MOCK_USERS;
        const user = users.find(u => u.id === userId);

        if (!user?.license || user.license.status !== 'active') {
          return {
            canAccess: false,
            reason: 'Geen geldig AI-rijbewijs'
          };
        }

        const userTools = get().getUserTools(userId);
        const hasTool = userTools.some(t => t.id === toolId);

        return {
          canAccess: hasTool,
          reason: hasTool ? 'Toegang goedgekeurd' : 'Tool niet beschikbaar voor jouw rol'
        };
      }
    }),
    {
      name: 'routeai-storage',
      partialize: (state) => ({
        // Persist alleen training progress
        // currentUser NIET opslaan (fresh login every time)
        trainingProgress: state.trainingProgress
      })
    }
  )
);
