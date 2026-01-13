import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AILicense } from "@/types";
import { MOCK_USERS } from "@/data/mockUsers";
import { BASE_CAPABILITIES, getDefaultCapabilities } from "@/data/baseCapabilities";

type UserRole = 'user' | 'org_admin';

interface AppState {
  // Current user
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Users data
  users: User[];
  getUserById: (id: string) => User | undefined;
  getUserByRole: (role: UserRole) => User | undefined;

  // Training
  startTraining: (userId: string) => void;
  completeModule: (userId: string, moduleId: string) => void;
  submitAssessment: (userId: string, score: number) => void;

  // License management
  issueLicense: (userId: string) => void;

  // Authority checking
  userHasCapability: (userId: string, capabilityId: string) => boolean;
  getUserCapabilities: (userId: string) => string[];
  checkUsageAuthority: (userId: string, usage: string) => boolean;
  canUserAccessTool: (userId: string, toolId: string) => boolean;
}

// Track training progress separately (not on User type)
interface TrainingProgressMap {
  [userId: string]: {
    completedModules: string[];
    assessmentScore: number | null;
    startedAt?: string;
    completedAt?: string;
  };
}

let trainingProgressStore: TrainingProgressMap = {};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      users: [...MOCK_USERS],

      // Set current user
      setCurrentUser: (user) => set({ currentUser: user }),

      // Get user by ID
      getUserById: (id) => {
        return get().users.find((u) => u.id === id);
      },

      // Get user by role (voor login simulatie)
      getUserByRole: (role) => {
        return get().users.find((u) => u.role === role);
      },

      // Start training
      startTraining: (userId) => {
        trainingProgressStore[userId] = {
          completedModules: [],
          assessmentScore: null,
          startedAt: new Date().toISOString(),
        };
      },

      // Complete a training module
      completeModule: (userId, moduleId) => {
        if (!trainingProgressStore[userId]) {
          trainingProgressStore[userId] = {
            completedModules: [],
            assessmentScore: null,
            startedAt: new Date().toISOString(),
          };
        }
        const progress = trainingProgressStore[userId];
        if (!progress.completedModules.includes(moduleId)) {
          progress.completedModules.push(moduleId);
        }
      },

      // Submit assessment
      submitAssessment: (userId, score) => {
        if (!trainingProgressStore[userId]) {
          trainingProgressStore[userId] = {
            completedModules: [],
            assessmentScore: null,
            startedAt: new Date().toISOString(),
          };
        }
        const progress = trainingProgressStore[userId];
        progress.assessmentScore = score;
        
        const passed = score >= 80;
        if (passed) {
          progress.completedAt = new Date().toISOString();
          // Also issue license
          get().issueLicense(userId);
        }
      },

      // Issue license after successful training
      issueLicense: (userId) =>
        set((state) => ({
          users: state.users.map((user) => {
            if (user.id === userId) {
              const now = new Date();
              const expiresAt = new Date(now);
              expiresAt.setFullYear(expiresAt.getFullYear() + 1);
              
              const license: AILicense = {
                certificateNumber: `NL-${now.getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`,
                userId: user.id,
                issuedAt: now.toISOString(),
                expiresAt: expiresAt.toISOString(),
                grantedCapabilities: getDefaultCapabilities(),
                status: "active",
                assessmentScore: trainingProgressStore[userId]?.assessmentScore || 80,
                completedAt: now.toISOString(),
                trainingLevel: 'basis',
              };
              
              const updatedUser = { ...user, license };
              
              // Update currentUser if this is them
              if (state.currentUser?.id === userId) {
                set({ currentUser: updatedUser });
              }
              
              return updatedUser;
            }
            return user;
          }),
        })),

      // Check if user has a specific capability
      userHasCapability: (userId, capabilityId) => {
        const user = get().getUserById(userId);
        if (!user || !user.license || user.license.status !== "active") {
          return false;
        }
        return user.license.grantedCapabilities.includes(capabilityId);
      },

      // Get all capabilities for a user
      getUserCapabilities: (userId) => {
        const user = get().getUserById(userId);
        if (!user || !user.license || user.license.status !== "active") {
          return [];
        }
        return user.license.grantedCapabilities;
      },

      // Check if user can perform a specific usage
      checkUsageAuthority: (userId, usage) => {
        const userCapabilities = get().getUserCapabilities(userId);

        // Map common usages to required capabilities
        const usageToCapability: Record<string, string> = {
          "text-generation": "cap-text-ops",
          ideation: "cap-ideation",
          analysis: "cap-basic-analysis",
          brainstorming: "cap-ideation",
          "data-analysis": "cap-basic-analysis",
        };

        const requiredCap = usageToCapability[usage];
        if (!requiredCap) return false;

        return userCapabilities.includes(requiredCap);
      },

      // Check if user can access a specific tool
      canUserAccessTool: (userId, toolId) => {
        const user = get().getUserById(userId);
        if (!user || !user.license || user.license.status !== "active") {
          return false;
        }
        // For now, if user has a license, they can access all tools
        return true;
      },
    }),
    {
      name: "routeai-storage",
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
      }),
    },
  ),
);

// Helper to get training progress
export function getTrainingProgress(userId: string) {
  return trainingProgressStore[userId] || {
    completedModules: [],
    assessmentScore: null,
  };
}
