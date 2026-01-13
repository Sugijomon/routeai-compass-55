import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole, TrainingProgress, AILicense } from "@/types";
import { mockUsers } from "@/data/mockUsers";
import { baseCapabilities } from "@/data/baseCapabilities";
import { trainingModules } from "@/data/trainingData";

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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      users: mockUsers,

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
      startTraining: (userId) =>
        set((state) => ({
          users: state.users.map((user) => {
            if (user.id === userId) {
              return {
                ...user,
                trainingProgress: {
                  completedModules: [],
                  assessmentScore: null,
                  certificateIssued: false,
                  startedAt: new Date().toISOString(),
                },
              };
            }
            return user;
          }),
        })),

      // Complete a training module
      completeModule: (userId, moduleId) =>
        set((state) => ({
          users: state.users.map((user) => {
            if (user.id === userId && user.trainingProgress) {
              const completedModules = [...user.trainingProgress.completedModules];
              if (!completedModules.includes(moduleId)) {
                completedModules.push(moduleId);
              }
              return {
                ...user,
                trainingProgress: {
                  ...user.trainingProgress,
                  completedModules,
                },
              };
            }
            return user;
          }),
        })),

      // Submit assessment
      submitAssessment: (userId, score) =>
        set((state) => ({
          users: state.users.map((user) => {
            if (user.id === userId && user.trainingProgress) {
              const passed = score >= 80; // 80% pass rate
              return {
                ...user,
                trainingProgress: {
                  ...user.trainingProgress,
                  assessmentScore: score,
                  certificateIssued: passed,
                  completedAt: passed ? new Date().toISOString() : undefined,
                },
              };
            }
            return user;
          }),
        })),

      // Issue license after successful training
      issueLicense: (userId) =>
        set((state) => ({
          users: state.users.map((user) => {
            if (user.id === userId) {
              // Create a basic license with all base capabilities
              const license: AILicense = {
                id: `lic-${Date.now()}`,
                userId: user.id,
                issuedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
                grantedCapabilities: baseCapabilities.map((cap) => cap.id),
                status: "active",
              };
              return {
                ...user,
                license,
              };
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
          "text-generation": "text-operations",
          ideation: "ideation",
          analysis: "analysis",
          brainstorming: "ideation",
          "data-analysis": "analysis",
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
        // In future, can add tool-specific capability requirements
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
