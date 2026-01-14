import { User } from "../types";
import { getDefaultCapabilities } from "./baseCapabilities";

export const MOCK_USERS: User[] = [
  // USER 1: Jan Smit - Basic user met beperkte toegang (text + brainstorm)
  {
    id: "user-1",
    name: "Jan Smit",
    email: "jan.smit@bedrijf.nl",
    role: "user",
    department: "Marketing",
    organisationId: "org-1",
    license: {
      certificateNumber: "NL-2025-00137",
      userId: "user-1",
      trainingLevel: "basis",
      issuedAt: "2025-12-15T10:00:00Z",
      expiresAt: "2026-12-15T10:00:00Z",
      grantedCapabilities: ["text-redactie", "brainstorm-ideeen"],
      status: "active",
      assessmentScore: 85,
      completedAt: "2025-12-15T10:00:00Z",
    },
    trainingProgress: {
      completedModules: ["module-1", "module-2", "module-3", "module-4"],
      assessmentScore: 85,
      certificateIssued: true,
      startedAt: "2025-12-14T09:00:00Z",
      completedAt: "2025-12-15T10:00:00Z",
    },
  },

  // USER 2: Lisa de Vries - Org Admin met alle capabilities
  {
    id: "user-2",
    name: "Lisa de Vries",
    email: "lisa@acmebv.nl",
    role: "org_admin",
    department: "IT",
    organisationId: "org-1",
    license: {
      certificateNumber: "NL-2025-00138",
      userId: "user-2",
      status: "active",
      assessmentScore: 93,
      completedAt: "2025-01-05T10:15:00Z",
      trainingLevel: "gevorderd",
      grantedCapabilities: getDefaultCapabilities(), // All capabilities
      issuedAt: "2025-01-05T10:20:00Z",
      expiresAt: "2026-01-05T10:20:00Z",
      issuedBy: "system",
    },
    trainingProgress: {
      completedModules: ["module-1", "module-2", "module-3", "module-4"],
      assessmentScore: 93,
      certificateIssued: true,
      startedAt: "2025-01-04T08:00:00Z",
      completedAt: "2025-01-05T10:15:00Z",
    },
  },

  // USER 3: Piet Jansen - User met alleen data-analyse (voor filtering test)
  {
    id: "user-3",
    name: "Piet Jansen",
    email: "piet@acmebv.nl",
    role: "user",
    department: "Finance",
    organisationId: "org-1",
    license: {
      certificateNumber: "NL-2025-00139",
      userId: "user-3",
      trainingLevel: "basis",
      issuedAt: "2025-02-01T10:00:00Z",
      expiresAt: "2026-02-01T10:00:00Z",
      grantedCapabilities: ["data-analyse"], // Only data analysis!
      status: "active",
      assessmentScore: 78,
      completedAt: "2025-02-01T10:00:00Z",
    },
    trainingProgress: {
      completedModules: ["module-1", "module-2", "module-3", "module-4"],
      assessmentScore: 78,
      certificateIssued: true,
      startedAt: "2025-01-30T09:00:00Z",
      completedAt: "2025-02-01T10:00:00Z",
    },
  },

  // USER 4: Emma Bakker - Org Admin met expert level (voor admin testing)
  {
    id: "user-4",
    name: "Emma Bakker",
    email: "emma.bakker@acmebv.nl",
    role: "org_admin",
    department: "IT",
    organisationId: "org-1",
    license: {
      certificateNumber: "NL-2025-00140",
      userId: "user-4",
      status: "active",
      assessmentScore: 98,
      completedAt: "2025-01-03T14:30:00Z",
      trainingLevel: "expert",
      grantedCapabilities: getDefaultCapabilities(), // All capabilities
      issuedAt: "2025-01-03T14:35:00Z",
      expiresAt: "2026-01-03T14:35:00Z",
      issuedBy: "system",
    },
    trainingProgress: {
      completedModules: ["module-1", "module-2", "module-3", "module-4"],
      assessmentScore: 98,
      certificateIssued: true,
      startedAt: "2025-01-02T08:00:00Z",
      completedAt: "2025-01-03T14:30:00Z",
    },
  },
];

export function getUserById(id: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}

export function getUserByRole(role: "user" | "org_admin"): User {
  return MOCK_USERS.find((u) => u.role === role)!;
}

// Helper voor testen - geef user op basis van naam
export function getUserByName(name: string): User | undefined {
  return MOCK_USERS.find((u) => u.name === name);
}
