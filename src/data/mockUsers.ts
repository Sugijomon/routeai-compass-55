import { User } from '../types';
import { getDefaultCapabilities } from './baseCapabilities';

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Jan Smit',
    email: 'jan.smit@bedrijf.nl',
    role: 'user',
    department: 'Marketing',
    organisationId: 'org-1',
    license: {
      certificateNumber: 'NL-2025-00137',
      userId: 'user-1',
      trainingLevel: 'basis',
      issuedAt: '2025-12-15T10:00:00Z',
      expiresAt: '2026-12-15T10:00:00Z',
      grantedCapabilities: ['text-redactie', 'brainstorm-ideeen'],
      status: 'active',
      assessmentScore: 85,
      completedAt: '2025-12-15T10:00:00Z',
    },
    trainingProgress: {
      completedModules: ['module-1', 'module-2', 'module-3', 'module-4'],
      assessmentScore: 85,
      certificateIssued: true,
      startedAt: '2025-12-14T09:00:00Z',
      completedAt: '2025-12-15T10:00:00Z',
    },
  },
  {
    id: 'user-2',
    name: 'Lisa de Vries',
    email: 'lisa@acmebv.nl',
    role: 'org_admin',
    department: 'IT',
    organisationId: 'org-1',
    license: {
      certificateNumber: 'NL-2025-00138',
      userId: 'user-2',
      status: 'active',
      assessmentScore: 93,
      completedAt: '2025-01-05T10:15:00Z',
      trainingLevel: 'gevorderd',
      grantedCapabilities: getDefaultCapabilities(),
      issuedAt: '2025-01-05T10:20:00Z',
      expiresAt: '2026-01-05T10:20:00Z',
      issuedBy: 'system'
    },
    trainingProgress: {
      completedModules: ['module-1', 'module-2', 'module-3', 'module-4'],
      assessmentScore: 93,
      certificateIssued: true,
      startedAt: '2025-01-04T08:00:00Z',
      completedAt: '2025-01-05T10:15:00Z',
    },
  },
  
  {
    id: 'user-3',
    name: 'Piet Jansen',
    email: 'piet@acmebv.nl',
    role: 'user',
    department: 'Finance',
    organisationId: 'org-1',
    license: null,
    trainingProgress: {
      completedModules: [],
      assessmentScore: null,
      certificateIssued: false,
    },
  }
];

export function getUserById(id: string): User | undefined {
  return MOCK_USERS.find(u => u.id === id);
}

export function getUserByRole(role: 'user' | 'org_admin'): User {
  return MOCK_USERS.find(u => u.role === role)!;
}
