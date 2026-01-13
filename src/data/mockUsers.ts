import { User } from '../types';
import { getDefaultCapabilities } from './baseCapabilities';

export const MOCK_USERS: User[] = [
{
  id: 'user-1',
  name: 'Jan Smit',
  email: 'jan.smit@bedrijf.nl',
  role: 'user',
  department: 'Marketing & Communicatie',
  
  // ✅ LICENSE MOET DIT HEBBEN:
  license: {
    id: 'lic-001',
    userId: 'user-1',
    trainingLevel: 'basis',  // ← DIT MOET ER ZIJN!
    issuedAt: '2025-12-15T10:00:00Z',
    expiresAt: '2026-12-15T10:00:00Z',
    grantedCapabilities: [
      'text-redactie',      // ← NIEUWE IDs
      'brainstorm-ideeen'   // ← NIEUWE IDs
    ],
    status: 'active',
  },
  
  // ✅ TRAINING PROGRESS MOET DIT HEBBEN:
  trainingProgress: {
    completedModules: ['module-1', 'module-2', 'module-3', 'module-4'], // 4/4!
    assessmentScore: 85,
    certificateIssued: true,
    startedAt: '2025-12-10T09:00:00Z',
    completedAt: '2025-12-15T10:00:00Z', // ← Completed date!
  }
}
  
  {
    id: 'user-2',
    name: 'Lisa de Vries',
    email: 'lisa@acmebv.nl',
    role: 'org_admin',
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
    }
  },
  
  {
    id: 'user-3',
    name: 'Piet Jansen',
    email: 'piet@acmebv.nl',
    role: 'user',
    organisationId: 'org-1',
    license: null // Nog geen rijbewijs behaald
  }
];

export function getUserById(id: string): User | undefined {
  return MOCK_USERS.find(u => u.id === id);
}

export function getUserByRole(role: 'user' | 'org_admin'): User {
  return MOCK_USERS.find(u => u.role === role)!;
}
