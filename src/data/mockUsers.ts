import { User, Organisation, UserProgress } from '@/types';

export const mockOrganisation: Organisation = {
  id: 'org-1',
  name: 'TechBedrijf B.V.',
  slug: 'techbedrijf',
  industry: 'Technology',
  size: 'medium',
  createdAt: '2024-01-15T00:00:00.000Z',
};

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Anna de Vries',
    email: 'anna@techbedrijf.nl',
    role: 'user',
    organisationId: 'org-1',
    license: {
      certificateNumber: 'RAI-2024-001',
      userId: 'user-1',
      status: 'active',
      assessmentScore: 87.5,
      completedAt: '2024-06-15T14:30:00.000Z',
      grantedCapabilities: [
        'cap-text-summary',
        'cap-text-rewrite',
        'cap-ideation',
        'cap-draft-creation',
        'cap-translation',
      ],
      issuedAt: '2024-06-15T14:30:00.000Z',
      expiresAt: '2025-06-15T14:30:00.000Z',
      issuedBy: 'RouteAI Systeem',
    },
  },
  {
    id: 'user-2',
    name: 'Pieter Jansen',
    email: 'pieter@techbedrijf.nl',
    role: 'org_admin',
    organisationId: 'org-1',
    license: {
      certificateNumber: 'RAI-2024-002',
      userId: 'user-2',
      status: 'active',
      assessmentScore: 100,
      completedAt: '2024-05-20T10:00:00.000Z',
      grantedCapabilities: [
        'cap-text-summary',
        'cap-text-rewrite',
        'cap-ideation',
        'cap-draft-creation',
        'cap-data-analysis',
        'cap-translation',
        'cap-code-assistance',
        'cap-research',
      ],
      issuedAt: '2024-05-20T10:00:00.000Z',
      expiresAt: '2025-05-20T10:00:00.000Z',
      issuedBy: 'RouteAI Systeem',
    },
  },
  {
    id: 'user-3',
    name: 'Sophie van den Berg',
    email: 'sophie@techbedrijf.nl',
    role: 'user',
    organisationId: 'org-1',
    license: null, // Nog geen licentie
  },
  {
    id: 'user-4',
    name: 'Mark Bakker',
    email: 'mark@techbedrijf.nl',
    role: 'user',
    organisationId: 'org-1',
    license: {
      certificateNumber: 'RAI-2024-003',
      userId: 'user-4',
      status: 'expired',
      assessmentScore: 75,
      completedAt: '2023-06-10T09:00:00.000Z',
      grantedCapabilities: [
        'cap-text-summary',
        'cap-ideation',
      ],
      issuedAt: '2023-06-10T09:00:00.000Z',
      expiresAt: '2024-06-10T09:00:00.000Z',
      issuedBy: 'RouteAI Systeem',
    },
  },
];

export const mockUserProgress: UserProgress[] = [
  {
    userId: 'user-1',
    trainingProgress: [
      { moduleId: 'module-1', completed: true, completedAt: '2024-06-14T10:00:00.000Z' },
      { moduleId: 'module-2', completed: true, completedAt: '2024-06-14T11:00:00.000Z' },
      { moduleId: 'module-3', completed: true, completedAt: '2024-06-15T09:00:00.000Z' },
      { moduleId: 'module-4', completed: true, completedAt: '2024-06-15T10:00:00.000Z' },
    ],
    assessmentAttempts: 1,
    lastAssessmentScore: 87.5,
    lastAssessmentAt: '2024-06-15T14:30:00.000Z',
  },
  {
    userId: 'user-3',
    trainingProgress: [
      { moduleId: 'module-1', completed: true, completedAt: '2024-07-01T10:00:00.000Z' },
      { moduleId: 'module-2', completed: false },
      { moduleId: 'module-3', completed: false },
      { moduleId: 'module-4', completed: false },
    ],
    assessmentAttempts: 0,
  },
];
