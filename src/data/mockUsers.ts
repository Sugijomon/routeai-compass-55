import { User } from '../types';
import { getDefaultCapabilities } from './baseCapabilities';

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Jan Smit',
    email: 'jan@acmebv.nl',
    role: 'user',
    organisationId: 'org-1',
    license: {
      certificateNumber: 'NL-2025-00142',
      userId: 'user-1',
      status: 'active',
      assessmentScore: 87,
      completedAt: '2025-01-10T14:30:00Z',
      trainingLevel: 'basis',
      grantedCapabilities: getDefaultCapabilities(),
      issuedAt: '2025-01-10T14:35:00Z',
      expiresAt: '2026-01-10T14:35:00Z',
      issuedBy: 'admin-1'
    }
  },
  
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
