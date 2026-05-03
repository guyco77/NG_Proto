import type {
  User,
  Project,
  Task,
  Quote,
  Invoice,
  VendorPayment,
  Client,
  ClientUser,
  Vendor,
  Notification,
  NotificationPreference,
  DashboardStats,
  Service,
  TranslationRateCardEntry,
  VideoMinuteRate,
  InternalCost,
  BillingAuditEntry,
} from './types'

// USER-001: All system users (internal GUNO team + client users + vendor users)
export const mockUsers: User[] = [
  // Internal GUNO Team
  { id: '1', email: 'admin@guno.studio', name: 'Sarah Admin', phone: '+972-50-123-4567', role: 'admin', entityType: 'internal', status: 'active', createdAt: '2022-01-15', lastLoginAt: '2024-02-28T14:30:00Z' },
  { id: '2', email: 'pm@guno.studio', name: 'Mike Manager', phone: '+972-50-234-5678', role: 'pm', entityType: 'internal', status: 'active', createdAt: '2022-03-20', lastLoginAt: '2024-02-28T09:15:00Z' },
  { id: '5', email: 'finance@guno.studio', name: 'David Finance', phone: '+972-50-345-6789', role: 'finance', entityType: 'internal', status: 'active', createdAt: '2022-06-10', lastLoginAt: '2024-02-27T16:45:00Z' },
  { id: '6', email: 'it@guno.studio', name: 'Tom Tech', role: 'it', entityType: 'internal', status: 'active', createdAt: '2022-08-01', lastLoginAt: '2024-02-28T11:00:00Z' },
  { id: '7', email: 'pm2@guno.studio', name: 'Emma Project', role: 'pm', entityType: 'internal', status: 'inactive', createdAt: '2023-01-15', lastLoginAt: '2024-01-10T08:30:00Z' },
  { id: '8', email: 'newadmin@guno.studio', name: 'Pending Admin', role: 'admin', entityType: 'internal', status: 'pending_setup', createdAt: '2024-02-25' },
  // Client Users (linked to client entities)
  { id: '3', email: 'jsmith@netflix.com', name: 'Jennifer Smith', phone: '+1-408-540-3700', role: 'client', entityType: 'client', linkedEntityId: 'c1', linkedEntityName: 'Netflix Inc.', status: 'active', createdAt: '2022-04-01', lastLoginAt: '2024-02-27T18:20:00Z' },
  { id: '9', email: 'mbrown@disney.com', name: 'Michael Brown', role: 'client', entityType: 'client', linkedEntityId: 'c2', linkedEntityName: 'Disney Streaming', status: 'active', createdAt: '2022-07-15', lastLoginAt: '2024-02-26T10:00:00Z' },
  { id: '10', email: 'edavis@wbd.com', name: 'Emily Davis', role: 'client', entityType: 'client', linkedEntityId: 'c3', linkedEntityName: 'Warner Bros.', status: 'active', createdAt: '2023-02-01', lastLoginAt: '2024-02-25T14:30:00Z' },
  { id: '11', email: 'pending@netflix.com', name: 'Pending Client User', role: 'client', entityType: 'client', linkedEntityId: 'c1', linkedEntityName: 'Netflix Inc.', status: 'pending_setup', createdAt: '2024-02-20' },
  // Vendor Users (linked to vendor entities)
  { id: '4', email: 'lisa@translatepro.com', name: 'Lisa Translator', phone: '+1-555-0101', role: 'vendor', entityType: 'vendor', linkedEntityId: 'v1', linkedEntityName: 'Lisa Translator', status: 'active', createdAt: '2022-05-15', lastLoginAt: '2024-02-28T12:00:00Z' },
  { id: '12', email: 'pierre@frenchsubs.com', name: 'Pierre Dubois', role: 'vendor', entityType: 'vendor', linkedEntityId: 'v2', linkedEntityName: 'Pierre Dubois', status: 'active', createdAt: '2021-11-20', lastLoginAt: '2024-02-27T09:45:00Z' },
  { id: '13', email: 'maria@adaptations.es', name: 'Maria Garcia', role: 'vendor', entityType: 'vendor', linkedEntityId: 'v3', linkedEntityName: 'Maria Garcia', status: 'active', createdAt: '2023-02-10', lastLoginAt: '2024-02-26T15:30:00Z' },
  { id: '14', email: 'newvendor@example.com', name: 'New Vendor', role: 'vendor', entityType: 'vendor', linkedEntityId: 'v6', linkedEntityName: 'James Chen', status: 'pending_setup', createdAt: '2024-02-10' },
  // SSO-only user example
  { id: '15', email: 'sso.user@netflix.com', name: 'SSO User', role: 'client', entityType: 'client', linkedEntityId: 'c1', linkedEntityName: 'Netflix Inc.', status: 'active', createdAt: '2023-06-01', lastLoginAt: '2024-02-28T08:00:00Z', isSSOOnly: true },
]

export const USER_ROLES: { value: string; label: string }[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'pm', label: 'Project Manager' },
  { value: 'client', label: 'Client' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'finance', label: 'Finance' },
  { value: 'it', label: 'IT Admin' },
]

export const USER_STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'gray' },
  { value: 'pending_setup', label: 'Pending Setup', color: 'yellow' },
]

// USER-006/007: Audit Log
export interface AuditLogEntry {
  id: string
  timestamp: string
  module: 'auth' | 'users' | 'projects' | 'tasks' | 'billing' | 'clients' | 'vendors'
  action: string
  actorId: string
  actorName: string
  actorRole: string
  targetId?: string
  targetType?: string
  targetName?: string
  details?: string
}

export const mockAuditLog: AuditLogEntry[] = [
  { id: 'al1', timestamp: '2024-02-28T14:30:00Z', module: 'auth', action: 'login', actorId: '1', actorName: 'Sarah Admin', actorRole: 'Admin', details: 'Logged in from 192.168.1.1' },
  { id: 'al2', timestamp: '2024-02-28T14:15:00Z', module: 'users', action: 'user_invited', actorId: '1', actorName: 'Sarah Admin', actorRole: 'Admin', targetId: '8', targetType: 'user', targetName: 'Pending Admin', details: 'Invited as Admin' },
  { id: 'al3', timestamp: '2024-02-28T12:00:00Z', module: 'projects', action: 'status_changed', actorId: '2', actorName: 'Mike Manager', actorRole: 'PM', targetId: 'p1', targetType: 'project', targetName: 'Netflix Q1 Localization', details: 'Status changed to In Progress' },
  { id: 'al4', timestamp: '2024-02-28T11:30:00Z', module: 'tasks', action: 'vendor_assigned', actorId: '2', actorName: 'Mike Manager', actorRole: 'PM', targetId: 't2', targetType: 'task', targetName: 'Episode 1 - Subtitling FR', details: 'Assigned to Pierre Dubois' },
  { id: 'al5', timestamp: '2024-02-28T10:00:00Z', module: 'billing', action: 'invoice_sent', actorId: '5', actorName: 'David Finance', actorRole: 'Finance', targetId: 'inv2', targetType: 'invoice', targetName: 'INV-2024-002', details: 'Sent to Warner Bros.' },
  { id: 'al6', timestamp: '2024-02-27T16:45:00Z', module: 'users', action: 'role_changed', actorId: '1', actorName: 'Sarah Admin', actorRole: 'Admin', targetId: '7', targetType: 'user', targetName: 'Emma Project', details: 'Role changed from Admin to PM' },
  { id: 'al7', timestamp: '2024-02-27T15:30:00Z', module: 'users', action: 'user_deactivated', actorId: '6', actorName: 'Tom Tech', actorRole: 'IT', targetId: '7', targetType: 'user', targetName: 'Emma Project', details: 'Account deactivated' },
  { id: 'al8', timestamp: '2024-02-27T14:00:00Z', module: 'clients', action: 'client_created', actorId: '1', actorName: 'Sarah Admin', actorRole: 'Admin', targetId: 'c6', targetType: 'client', targetName: 'Paramount Global', details: 'New client onboarded' },
  { id: 'al9', timestamp: '2024-02-27T12:00:00Z', module: 'vendors', action: 'vendor_archived', actorId: '1', actorName: 'Sarah Admin', actorRole: 'Admin', targetId: 'v7', targetType: 'vendor', targetName: 'Old Vendor', details: 'Vendor archived' },
  { id: 'al10', timestamp: '2024-02-26T10:00:00Z', module: 'auth', action: 'password_reset', actorId: '6', actorName: 'Tom Tech', actorRole: 'IT', targetId: '12', targetType: 'user', targetName: 'Pierre Dubois', details: 'Admin-triggered password reset' },
  { id: 'al11', timestamp: '2024-02-25T09:00:00Z', module: 'users', action: 'user_invited', actorId: '1', actorName: 'Sarah Admin', actorRole: 'Admin', targetId: '14', targetType: 'user', targetName: 'New Vendor', details: 'Invited as Vendor via CSV import' },
  { id: 'al12', timestamp: '2024-02-24T16:30:00Z', module: 'billing', action: 'payment_marked_paid', actorId: '5', actorName: 'David Finance', actorRole: 'Finance', targetId: 'vp1', targetType: 'vendor_payment', targetName: 'Lisa Translator - Episode 1', details: 'Marked as paid' },
]

export const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'Netflix Q1 Localization',
    client: 'Netflix Inc.',
    clientId: 'c1',
    clientContact: 'Jennifer Smith',
    status: 'in_progress',
    priority: 'high',
    startDate: '2024-01-15',
    deadline: '2024-03-15',
    budget: 125000,
    spent: 78500,
    currency: 'ILS',
    progress: 65,
    pm: 'Mike Manager',
    pmId: '2',
    services: ['Subtitles Transcription AI', 'Translation from Audio + Template', 'Extra QC'],
    languages: [
      { source: 'EN', target: 'ES', service: 'Subtitles Transcription AI' },
      { source: 'EN', target: 'FR', service: 'Subtitles Transcription AI' },
      { source: 'EN', target: 'DE', service: 'Translation from Audio + Template' },
    ],
    taskCount: 24,
    completedTasks: 16,
    quoteId: 'q2',
    videoVolume: 145.5, // minutes
  },
  {
    id: 'p2',
    name: 'Disney+ Series Adaptation',
    client: 'Disney Streaming',
    clientId: 'c2',
    clientContact: 'Michael Brown',
    status: 'in_progress',
    priority: 'medium',
    startDate: '2024-02-01',
    deadline: '2024-04-30',
    budget: 250000,
    spent: 45000,
    currency: 'EUR',
    progress: 25,
    pm: 'Mike Manager',
    pmId: '2',
    services: ['Translation from Audio', 'Subtitles Transcription'],
    languages: [
      { source: 'EN', target: 'ES', service: 'Translation from Audio' },
      { source: 'EN', target: 'PT', service: 'Subtitles Transcription' },
    ],
    taskCount: 48,
    completedTasks: 12,
    videoVolume: 280.0, // minutes
  },
  {
    id: 'p3',
    name: 'HBO Max Documentary',
    client: 'Warner Bros.',
    clientId: 'c3',
    clientContact: 'Emily Davis',
    status: 'in_review',
    priority: 'medium',
    startDate: '2023-12-01',
    deadline: '2024-02-28',
    budget: 85000,
    spent: 82000,
    currency: 'ILS',
    progress: 95,
    pm: 'Sarah Admin',
    pmId: '1',
    services: ['Subtitles Transcription', 'Proofread'],
    languages: [
      { source: 'EN', target: 'ES', service: 'Subtitles Transcription' },
      { source: 'EN', target: 'FR', service: 'Proofread' },
    ],
    taskCount: 18,
    completedTasks: 17,
    videoVolume: 92.5, // minutes
  },
  {
    id: 'p7', // Fixed: was duplicate 'p5'
    name: 'Apple TV+ Drama Series',
    client: 'Apple Inc.',
    clientId: 'c5',
    clientContact: 'Tim Cook Jr.',
    status: 'draft',
    priority: 'high',
    startDate: '2026-05-15',
    deadline: '2026-07-30',
    budget: 180000,
    spent: 0,
    currency: 'USD',
    progress: 0,
    pm: 'Mike Manager',
    pmId: '2',
    services: ['Subtitles Transcription'],
    languages: [
      { source: 'EN', target: 'ES', service: 'Subtitles Transcription' },
      { source: 'EN', target: 'FR', service: 'Subtitles Transcription' },
    ],
    taskCount: 8,
    completedTasks: 0,
    videoVolume: 220.0, // minutes
  },
  {
    id: 'p4',
    name: 'Amazon Prime Feature Film',
    client: 'Amazon Studios',
    clientId: 'c4',
    clientContact: 'Robert Wilson',
    status: 'quoted',
    priority: 'high',
    startDate: '2024-03-01',
    deadline: '2024-06-30',
    budget: 180000,
    spent: 0,
    currency: 'ILS',
    progress: 0,
    pm: 'Mike Manager',
    pmId: '2',
    services: ['Translation from Audio + Template', 'Subtitles Transcription AI', 'Extra QC'],
    languages: [
      { source: 'EN', target: 'ES', service: 'Translation from Audio + Template' },
      { source: 'EN', target: 'DE', service: 'Translation from Audio + Template' },
      { source: 'EN', target: 'FR', service: 'Subtitles Transcription AI' },
    ],
    taskCount: 36,
    completedTasks: 0,
    quoteId: 'q1',
    videoVolume: 185.0, // minutes
  },
  {
    id: 'p5',
    name: 'Apple TV+ Mini Series',
    client: 'Apple Inc.',
    clientId: 'c5',
    clientContact: 'Sarah Johnson',
    status: 'closed',
    priority: 'low',
    startDate: '2023-10-01',
    deadline: '2024-01-15',
    budget: 95000,
    spent: 92500,
    currency: 'EUR',
    progress: 100,
    pm: 'Sarah Admin',
    pmId: '1',
    services: ['Subtitles Transcription', 'Translation from Audio'],
    languages: [
      { source: 'EN', target: 'JA', service: 'Subtitles Transcription' },
      { source: 'EN', target: 'KO', service: 'Translation from Audio' },
    ],
    taskCount: 20,
    completedTasks: 20,
    videoVolume: 115.0, // minutes
  },
  {
    id: 'p6',
    name: 'Paramount+ Reality Show',
    client: 'Paramount Global',
    clientId: 'c6',
    clientContact: 'Lisa Chen',
    status: 'draft',
    priority: 'low',
    startDate: '2024-04-01',
    deadline: '2024-07-15',
    budget: 0,
    spent: 0,
    progress: 0,
    pm: 'Mike Manager',
    pmId: '2',
    services: ['Subtitles Transcription AI'],
    languages: [],
    taskCount: 0,
    completedTasks: 0,
    videoVolume: 0, // TBD - draft project
  },
]

// Mock tasks with realistic spread of deadlines across April-June 2026
// Mix of past (for overdue demo), current, and future dates
// Task names use canonical Task Step Types
export const mockTasks: Task[] = [
  // Completed tasks (past dates OK)
  { id: 't1', projectId: 'p1', projectName: 'Netflix Q1 Localization', name: 'Translation', service: 'Subtitles Transcription AI', serviceType: 'Translation', status: 'complete', assignedVendor: 'Lisa Translator', vendorId: 'v1', dueDate: '2026-04-15', price: 450, sourceLanguage: 'EN', targetLanguage: 'ES' },
  { id: 't2', projectId: 'p1', projectName: 'Netflix Q1 Localization', name: 'Translation', service: 'Subtitles Transcription AI', serviceType: 'Translation', status: 'complete', assignedVendor: 'Pierre Dubois', vendorId: 'v2', dueDate: '2026-04-20', price: 450, sourceLanguage: 'EN', targetLanguage: 'FR' },
  
  // In progress tasks (mix of near-term and future)
  { id: 't3', projectId: 'p1', projectName: 'Netflix Q1 Localization', name: 'Transcription', service: 'Dubbing with AI Transcript', serviceType: 'Transcription', status: 'in_progress', assignedVendor: 'Lisa Translator', vendorId: 'v1', dueDate: '2026-05-05', price: 2500, sourceLanguage: 'EN', targetLanguage: 'DE' },
  { id: 't6', projectId: 'p3', projectName: 'HBO Max Documentary', name: 'QC', service: 'QC Pass', serviceType: 'QC', status: 'in_progress', assignedVendor: 'Quality Team', vendorId: 'v4', dueDate: '2026-05-10', price: 600, sourceLanguage: 'EN', targetLanguage: 'ES' },
  
  // Assigned tasks (future dates)
  { id: 't7', projectId: 'p1', projectName: 'Netflix Q1 Localization', name: 'Timing', service: 'Subtitles Transcription AI', serviceType: 'Timing', status: 'assigned', assignedVendor: 'Lisa Translator', vendorId: 'v1', dueDate: '2026-05-08', price: 300, sourceLanguage: 'EN', targetLanguage: 'ES' },
  { id: 't9', projectId: 'p2', projectName: 'Disney+ Series Adaptation', name: 'Timing AI', service: 'Subtitles Transcription AI', serviceType: 'Timing AI', status: 'assigned', assignedVendor: 'Pierre Dubois', vendorId: 'v2', dueDate: '2026-05-15', price: 250, sourceLanguage: 'EN', targetLanguage: 'FR' },
  
  // Submitted tasks (future dates)
  { id: 't4', projectId: 'p2', projectName: 'Disney+ Series Adaptation', name: 'Translation from Audio', service: 'Translation from Audio', serviceType: 'Translation from Audio', status: 'submitted', assignedVendor: 'Maria Garcia', vendorId: 'v3', dueDate: '2026-05-12', price: 800, sourceLanguage: 'EN', targetLanguage: 'ES' },
  
  // Unassigned tasks (future dates - ready for assignment)
  { id: 't8', projectId: 'p1', projectName: 'Netflix Q1 Localization', name: 'PM Verification', service: 'Subtitles Transcription AI', serviceType: 'PM Verification', status: 'unassigned', dueDate: '2026-05-18', price: 150, sourceLanguage: 'EN', targetLanguage: 'ES' },
  { id: 't10', projectId: 'p3', projectName: 'HBO Max Documentary', name: 'Proofread', service: 'QC Pass', serviceType: 'Proofread', status: 'unassigned', dueDate: '2026-05-22', price: 200, sourceLanguage: 'EN', targetLanguage: 'ES' },
  { id: 't11', projectId: 'p4', projectName: 'Amazon Prime Feature Film', name: 'Transcription AI', service: 'Subtitles Transcription AI', serviceType: 'Transcription AI', status: 'unassigned', dueDate: '2026-05-25', price: 350, sourceLanguage: 'EN', targetLanguage: 'DE' },
  
  // Open for offers tasks (future May dates)
  { id: 't5', projectId: 'p2', projectName: 'Disney+ Series Adaptation', name: 'QC', service: 'Dubbing with AI Transcript', serviceType: 'QC', status: 'open_for_offers', dueDate: '2026-05-08', price: 3500, sourceLanguage: 'EN', targetLanguage: 'ES' },
  { id: 't12', projectId: 'p1', projectName: 'Netflix Q1 Localization', name: 'Client Review', service: 'QC Pass', serviceType: 'Client Review', status: 'open_for_offers', dueDate: '2026-05-20', price: 500, sourceLanguage: 'EN', targetLanguage: 'ES' },
  
  // OVERDUE TASKS - Today is 4/30/2026, these are clearly past due
  // These demonstrate the overdue state with red styling and warning icon
  { id: 't13', projectId: 'p3', projectName: 'HBO Max Documentary', name: 'Translation', service: 'Subtitles Transcription AI', serviceType: 'Translation', status: 'in_progress', assignedVendor: 'Maria Garcia', vendorId: 'v3', dueDate: '2026-04-25', price: 400, sourceLanguage: 'EN', targetLanguage: 'PT' },
  { id: 't16', projectId: 'p1', projectName: 'Netflix Q1 Localization', name: 'QC', service: 'QC Pass', serviceType: 'QC', status: 'assigned', assignedVendor: 'Lisa Translator', vendorId: 'v1', dueDate: '2026-04-20', price: 200, sourceLanguage: 'EN', targetLanguage: 'ES' },
  { id: 't17', projectId: 'p2', projectName: 'Disney+ Series Adaptation', name: 'Timing', service: 'Subtitles Transcription AI', serviceType: 'Timing', status: 'in_progress', assignedVendor: 'Pierre Dubois', vendorId: 'v2', dueDate: '2026-04-15', price: 350, sourceLanguage: 'EN', targetLanguage: 'FR' },
  { id: 't18', projectId: 'p3', projectName: 'HBO Max Documentary', name: 'Proofread', service: 'QC Pass', serviceType: 'Proofread', status: 'assigned', assignedVendor: 'Quality Team', vendorId: 'v4', dueDate: '2026-04-28', price: 180, sourceLanguage: 'EN', targetLanguage: 'ES' },
  
  // Future tasks in June
  { id: 't14', projectId: 'p4', projectName: 'Amazon Prime Feature Film', name: 'Translation', service: 'Subtitles Transcription AI', serviceType: 'Translation', status: 'assigned', assignedVendor: 'Lisa Translator', vendorId: 'v1', dueDate: '2026-06-05', price: 600, sourceLanguage: 'EN', targetLanguage: 'ES' },
  { id: 't15', projectId: 'p4', projectName: 'Amazon Prime Feature Film', name: 'Timing', service: 'Subtitles Transcription AI', serviceType: 'Timing', status: 'unassigned', dueDate: '2026-06-10', price: 280, sourceLanguage: 'EN', targetLanguage: 'FR' },
  
  // Draft project tasks (p5: Apple TV+ Drama Series) - Service: Subtitles Transcription
  // Workflow: Transcription -> Timing -> PM Verification -> Client Review
  // Spanish (ES) tasks
// Fixed: Changed projectId from 'p5' to 'p7' for Apple TV+ Drama Series
  { id: 't19', projectId: 'p7', projectName: 'Apple TV+ Drama Series', name: 'Transcription', service: 'Subtitles Transcription', serviceType: 'Transcription', status: 'unassigned', dueDate: '2026-06-01', price: 880, sourceLanguage: 'EN', targetLanguage: 'ES' },
  { id: 't20', projectId: 'p7', projectName: 'Apple TV+ Drama Series', name: 'Timing', service: 'Subtitles Transcription', serviceType: 'Timing', status: 'unassigned', dueDate: '2026-06-15', price: 440, sourceLanguage: 'EN', targetLanguage: 'ES' },
  { id: 't21', projectId: 'p7', projectName: 'Apple TV+ Drama Series', name: 'PM Verification', service: 'Subtitles Transcription', serviceType: 'PM Verification', status: 'unassigned', dueDate: '2026-06-25', price: 220, sourceLanguage: 'EN', targetLanguage: 'ES' },
  { id: 't22', projectId: 'p7', projectName: 'Apple TV+ Drama Series', name: 'Client Review', service: 'Subtitles Transcription', serviceType: 'Client Review', status: 'unassigned', dueDate: '2026-07-05', price: 0, sourceLanguage: 'EN', targetLanguage: 'ES' },

  { id: 't23', projectId: 'p7', projectName: 'Apple TV+ Drama Series', name: 'Transcription', service: 'Subtitles Transcription', serviceType: 'Transcription', status: 'unassigned', dueDate: '2026-06-01', price: 880, sourceLanguage: 'EN', targetLanguage: 'FR' },
  { id: 't24', projectId: 'p7', projectName: 'Apple TV+ Drama Series', name: 'Timing', service: 'Subtitles Transcription', serviceType: 'Timing', status: 'unassigned', dueDate: '2026-06-15', price: 440, sourceLanguage: 'EN', targetLanguage: 'FR' },
  { id: 't25', projectId: 'p7', projectName: 'Apple TV+ Drama Series', name: 'PM Verification', service: 'Subtitles Transcription', serviceType: 'PM Verification', status: 'unassigned', dueDate: '2026-06-25', price: 220, sourceLanguage: 'EN', targetLanguage: 'FR' },
  { id: 't26', projectId: 'p7', projectName: 'Apple TV+ Drama Series', name: 'Client Review', service: 'Subtitles Transcription', serviceType: 'Client Review', status: 'unassigned', dueDate: '2026-07-05', price: 0, sourceLanguage: 'EN', targetLanguage: 'FR' },
]

export const TASK_STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'unassigned', label: 'Unassigned', color: 'gray' },
  { value: 'open_for_offers', label: 'Open for Offers', color: 'orange' },
  { value: 'assigned', label: 'Assigned', color: 'blue' },
  { value: 'in_progress', label: 'In Progress', color: 'yellow' },
  { value: 'submitted', label: 'Submitted', color: 'purple' },
  { value: 'complete', label: 'Complete', color: 'green' },
]

// Canonical Task Step Names (Workflow Steps) - single source of truth
// These are the ONLY valid task step types for workflows, tasks, and filters
// Distinct from the 17 Project Services in Epic 14 - Services
export const TASK_STEP_TYPES = [
  'Transcription',
  'Transcription AI',
  'Timing',
  'Timing AI',
  'Translation',
  'Translation from Audio',
  'Upload TT',
  'Upload Text File',
  'QC',
  'PM Verification',
  'Proofread',
  'Client Review',
  'Upload Client Asset',
  'Upload Rough Cut',
  'New Cut',
  'Project Creation',
] as const

// Alias for backwards compatibility
export const TASK_SERVICE_TYPES = TASK_STEP_TYPES

// Update 01: mockQuotes with name field (required), projectId optional, price replaces totalAmount
export const mockQuotes: Quote[] = [
  {
    id: 'q1',
    quoteNumber: 'Q-2024-001',
    name: 'Amazon Feature Film Localization',
    description: 'Full localization services for upcoming feature film release.',
    projectId: 'p4',
    projectName: 'Amazon Prime Feature Film',
    clientId: 'c4',
    clientName: 'Amazon Studios',
    status: 'sent',
    services: ['Translation from Audio', 'Subtitles Transcription AI', 'Extra QC'],
    sourceLanguage: 'EN',
    targetLanguages: ['ES', 'DE', 'FR'],
    currency: 'USD',
    price: 158400,
    createdAt: '2024-02-01',
    sentAt: '2024-02-02',
    notesToClient: 'Thank you for choosing NG Broadcast. This quote covers full localization services for your feature film.',
    internalNotes: 'High priority client. Consider 5% discount on next project.',
    items: [
      { id: 'qi1', service: 'Translation from Audio', description: 'Full dubbing ES + DE', quantity: 120, unitRate: 1000, lineTotal: 120000 },
      { id: 'qi2', service: 'Subtitles Transcription AI', description: 'Subtitling FR', quantity: 120, unitRate: 300, lineTotal: 36000 },
      { id: 'qi3', service: 'Extra QC', description: 'Quality control all deliverables', quantity: 20, unitRate: 120, lineTotal: 2400 },
    ],
    pmId: '2',
    pmName: 'Mike Manager',
    version: 1,
  },
  {
    id: 'q2',
    quoteNumber: 'Q-2024-002',
    name: 'Netflix Q1 Localization Package',
    description: 'Q1 localization for 10 episodes including subtitling and dubbing.',
    projectId: 'p1',
    projectName: 'Netflix Q1 Localization',
    clientId: 'c1',
    clientName: 'Netflix Inc.',
    status: 'approved',
    services: ['Subtitles Transcription AI', 'Translation from Audio', 'Extra QC'],
    sourceLanguage: 'EN',
    targetLanguages: ['ES', 'FR', 'DE'],
    currency: 'USD',
    price: 125000,
    createdAt: '2024-01-10',
    sentAt: '2024-01-10',
    approvedAt: '2024-01-12',
    approvedBy: 'Jennifer Smith',
    signatureData: 'Jennifer Smith',
    notesToClient: 'We look forward to working on your Q1 localization project.',
    items: [
      { id: 'qi4', service: 'Subtitles Transcription AI', description: 'Subtitling - 10 episodes (ES, FR)', quantity: 200, unitRate: 250, lineTotal: 50000 },
      { id: 'qi5', service: 'Translation from Audio', description: 'Dubbing - 10 episodes (DE)', quantity: 100, unitRate: 700, lineTotal: 70000 },
      { id: 'qi6', service: 'Extra QC', description: 'Final QC pass', quantity: 50, unitRate: 100, lineTotal: 5000 },
    ],
    pmId: '2',
    pmName: 'Mike Manager',
    version: 2,
  },
  {
    id: 'q3',
    quoteNumber: 'Q-2024-003',
    name: 'Paramount Reality Show Subtitling',
    projectId: 'p6',
    projectName: 'Paramount+ Reality Show',
    clientId: 'c6',
    clientName: 'Paramount Global',
    status: 'unsent',
    services: ['Subtitles Transcription AI'],
    currency: 'USD',
    price: 45000,
    createdAt: '2024-02-15',
    items: [
      { id: 'qi7', service: 'Subtitles Transcription AI', description: 'Subtitling - 12 episodes', quantity: 120, unitRate: 375, lineTotal: 45000 },
    ],
    pmId: '2',
    pmName: 'Mike Manager',
  },
  {
    id: 'q4',
    quoteNumber: 'Q-2024-004',
    name: 'Disney Series Full Adaptation',
    description: 'Complete adaptation package for the new animated series.',
    projectId: 'p2',
    projectName: 'Disney+ Series Adaptation',
    clientId: 'c2',
    clientName: 'Disney Streaming',
    status: 'changes_requested',
    services: ['Translation from Audio', 'Subtitles Transcription AI', 'Extra QC'],
    sourceLanguage: 'EN',
    targetLanguages: ['ES', 'PT'],
    currency: 'USD',
    price: 250000,
    createdAt: '2024-01-25',
    sentAt: '2024-01-26',
    notesToClient: 'Complete adaptation package for your new series.',
    internalNotes: 'Client asked for breakdown by episode. Need to revise line items.',
    items: [
      { id: 'qi8', service: 'Translation from Audio', description: 'Dubbing ES', quantity: 200, unitRate: 800, lineTotal: 160000 },
      { id: 'qi9', service: 'Subtitles Transcription AI', description: 'Subtitling PT', quantity: 200, unitRate: 350, lineTotal: 70000 },
      { id: 'qi10', service: 'Extra QC', description: 'QC all deliverables', quantity: 200, unitRate: 100, lineTotal: 20000 },
    ],
    pmId: '2',
    pmName: 'Mike Manager',
  },
  {
    id: 'q5',
    quoteNumber: 'Q-2024-005',
    name: 'HBO Documentary Subtitling',
    description: 'Subtitling services for award-winning documentary series.',
    projectId: 'p3',
    projectName: 'HBO Max Documentary',
    clientId: 'c3',
    clientName: 'Warner Bros.',
    status: 'moved_to_show', // Update 02: changed from moved_to_project
    services: ['Subtitles Transcription AI', 'Extra QC'],
    sourceLanguage: 'EN',
    targetLanguages: ['ES', 'FR'],
    currency: 'USD',
    price: 85000,
    createdAt: '2023-11-20',
    sentAt: '2023-11-20',
    approvedAt: '2023-11-22',
    approvedBy: 'Emily Davis',
    signatureData: 'Emily Davis',
    items: [
      { id: 'qi11', service: 'Subtitles Transcription AI', description: 'Subtitling ES + FR', quantity: 180, unitRate: 400, lineTotal: 72000 },
      { id: 'qi12', service: 'Extra QC', description: 'Final QC', quantity: 130, unitRate: 100, lineTotal: 13000 },
    ],
    pmId: '1',
    pmName: 'Sarah Admin',
  },
  // Update 01: Example standalone quote (no project linked)
  {
    id: 'q6',
    quoteNumber: 'Q-2024-006',
    name: 'Verbal Request - Corporate Training Videos',
    description: 'Client called to discuss subtitling for internal training materials. No files submitted yet.',
    clientId: 'c1',
    clientName: 'Netflix Inc.',
    status: 'draft',
    services: ['Subtitles Transcription', 'Text Translation'],
    sourceLanguage: 'EN',
    targetLanguages: ['ES', 'FR', 'DE', 'JA'],
    currency: 'USD',
    price: 12000,
    createdAt: '2024-02-20',
    internalNotes: 'Estimate based on 60 minutes of content. Waiting for client to send files.',
    pmId: '2',
    pmName: 'Mike Manager',
  },
]

// Update 02: Changed moved_to_project → moved_to_show
export const QUOTE_STATUSES: { value: string; label: string }[] = [
  { value: 'unsent', label: 'Unsent' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'changes_requested', label: 'Changes Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'superseded', label: 'Superseded' },
  { value: 'moved_to_show', label: 'Moved to Show' },
]

// Update 01: Canonical 17 services grouped by category (Epic 14 - SERV-001)
export const SERVICES_BY_CATEGORY = {
  'Transcription Services': [
    'Subtitles Transcription',
    'Subtitles Transcription AI',
  ],
  'Translation Services': [
    'Translation from Audio + Template',
    'Translation from Audio',
    'Translation from Audio + Template AI',
    'Translation from Template AI',
    'Text Translation',
    'Translation Pivot Language',
  ],
  'Editing & Quality Control': [
    'Proofread',
    'Extra QC',
  ],
  'Technical & Special Services': [
    'Timing',
    'Client Corrections',
    'New Version (Re-conforming)',
    'Convert Files',
    'Other',
  ],
  'Administrative / Billing Only': [
    'Raw Materials',
    'Translation On-Site',
  ],
} as const

export const SERVICES_LIST = [
  'Subtitles Transcription',
  'Subtitles Transcription AI',
  'Translation from Audio + Template',
  'Translation from Audio',
  'Translation from Audio + Template AI',
  'Translation from Template AI',
  'Text Translation',
  'Translation Pivot Language',
  'Proofread',
  'Extra QC',
  'Timing',
  'Client Corrections',
  'New Version (Re-conforming)',
  'Convert Files',
  'Other',
  'Raw Materials',
  'Translation On-Site',
]

export const mockInvoices: Invoice[] = [
  { id: 'inv1', invoiceNumber: 'INV-2024-001', projectId: 'p5', projectName: 'Apple TV+ Mini Series', clientId: 'c5', clientName: 'Apple Inc.', status: 'paid', currency: 'USD', amount: 92500, dueDate: '2024-02-15', issuedDate: '2024-01-20', sentAt: '2024-01-20', viewedAt: '2024-01-21', paidAt: '2024-02-10', pdfUrl: '/invoices/inv-2024-001.pdf', iCountId: 'ic-001', syncedAt: '2024-01-20' },
  { id: 'inv2', invoiceNumber: 'INV-2024-002', projectId: 'p3', projectName: 'HBO Max Documentary', clientId: 'c3', clientName: 'Warner Bros.', status: 'viewed', currency: 'USD', amount: 42500, dueDate: '2024-03-01', issuedDate: '2024-02-01', sentAt: '2024-02-01', viewedAt: '2024-02-05', pdfUrl: '/invoices/inv-2024-002.pdf', iCountId: 'ic-002', syncedAt: '2024-02-01' },
  { id: 'inv3', invoiceNumber: 'INV-2024-003', projectId: 'p1', projectName: 'Netflix Q1 Localization', clientId: 'c1', clientName: 'Netflix Inc.', status: 'overdue', currency: 'USD', amount: 35000, dueDate: '2024-02-10', issuedDate: '2024-01-25', sentAt: '2024-01-25', pdfUrl: '/invoices/inv-2024-003.pdf', iCountId: 'ic-003', syncedAt: '2024-01-25' },
  { id: 'inv4', invoiceNumber: 'INV-2024-004', projectId: 'p2', projectName: 'Disney+ Series Adaptation', clientId: 'c2', clientName: 'Disney Streaming', status: 'draft', currency: 'USD', amount: 45000, dueDate: '2024-03-15', issuedDate: '2024-02-20', isManualUpload: true, uploadedBy: 'Sarah Admin', uploadedAt: '2024-02-20' },
  { id: 'inv5', invoiceNumber: 'INV-2024-005', projectId: 'p1', projectName: 'Netflix Q1 Localization', clientId: 'c1', clientName: 'Netflix Inc.', status: 'sent', currency: 'ILS', amount: 125000, dueDate: '2024-03-20', issuedDate: '2024-02-25', sentAt: '2024-02-25', pdfUrl: '/invoices/inv-2024-005.pdf', iCountId: 'ic-005', syncedAt: '2024-02-25' },
]

export const INVOICE_STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'sent', label: 'Unpaid', color: 'slate' },  // Neutral - invoice sent, within due date
  { value: 'viewed', label: 'Viewed', color: 'purple' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'overdue', label: 'Overdue', color: 'red' },  // Urgent - due date passed
]

// BILL-004/005: Vendor Payment Records
export const mockVendorPayments: VendorPayment[] = [
  { id: 'vp1', vendorId: 'v1', vendorName: 'Lisa Translator', taskId: 't1', taskName: 'Episode 1 - Subtitling ES', projectId: 'p1', projectName: 'Netflix Q1 Localization', rateType: 'per_video_minute', videoMinutes: 45, rate: 10, amount: 450, currency: 'USD', status: 'paid', createdAt: '2024-02-01', paidAt: '2024-02-15' },
  { id: 'vp2', vendorId: 'v2', vendorName: 'Pierre Dubois', taskId: 't2', taskName: 'Episode 1 - Subtitling FR', projectId: 'p1', projectName: 'Netflix Q1 Localization', rateType: 'per_video_minute', videoMinutes: 45, rate: 10, amount: 450, currency: 'USD', status: 'pending', createdAt: '2024-02-05' },
  { id: 'vp3', vendorId: 'v3', vendorName: 'Maria Garcia', taskId: 't4', taskName: 'Pilot - Script Adaptation', projectId: 'p2', projectName: 'Disney+ Series Adaptation', rateType: 'per_project', rate: 800, amount: 800, currency: 'USD', status: 'pending', createdAt: '2024-02-15' },
  { id: 'vp4', vendorId: 'v4', vendorName: 'Quality Team', taskId: 't6', taskName: 'Final QC Review', projectId: 'p3', projectName: 'HBO Max Documentary', rateType: 'per_video_minute', videoMinutes: 60, rate: 10, amount: 600, currency: 'USD', status: 'pending', createdAt: '2024-02-20' },
  { id: 'vp5', vendorId: 'v5', vendorName: 'Berlin Voice Studio', taskId: 't3', taskName: 'Episode 1 - Dubbing DE', projectId: 'p1', projectName: 'Netflix Q1 Localization', rateType: 'per_project', rate: 2500, amount: 2500, currency: 'EUR', status: 'pending', createdAt: '2024-02-10' },
  { id: 'vp6', vendorId: 'v1', vendorName: 'Lisa Translator', rateType: 'monthly', rate: 3000, amount: 3000, currency: 'USD', status: 'paid', period: '2024-01', createdAt: '2024-01-31', paidAt: '2024-02-05' },
  { id: 'vp7', vendorId: 'v1', vendorName: 'Lisa Translator', rateType: 'monthly', rate: 3000, amount: 3000, currency: 'USD', status: 'pending', period: '2024-02', createdAt: '2024-02-29' },
]

// Legacy export for backwards compatibility
export const mockVendorPayables = mockVendorPayments

export const mockClients: Client[] = [
  {
    id: 'c1',
    legalName: 'Netflix, Inc.',
    displayName: 'Netflix Inc.',
    companyId: 'US-77-0467272',
    timezone: 'America/Los_Angeles',
    contacts: [
      { id: 'cc1', name: 'Jennifer Smith', email: 'jsmith@netflix.com', phone: '+1 408-540-3700', role: 'Localization Director', isPrimary: true },
      { id: 'cc2', name: 'David Lee', email: 'dlee@netflix.com', role: 'Project Coordinator', isPrimary: false },
    ],
    billingAddress: '100 Winchester Circle, Los Gatos, CA 95032, USA',
    paymentTerms: 'net_30',
    defaultCurrency: 'USD',
    taxDetails: 'Tax Exempt - Media Production',
    discountPercent: 10,
    discountNotes: 'Long-term partner — 10% standing discount',
    preferredChannel: 'email',
    notificationRecipients: ['jsmith@netflix.com', 'dlee@netflix.com'],
    rateCard: [
      { serviceType: 'Subtitles Transcription AI', rate: 250, currency: 'USD' },
      { serviceType: 'Dubbing with AI Transcript', rate: 700, currency: 'USD' },
      { serviceType: 'Extra QC', rate: 100, currency: 'USD' },
    ],
    internalNotes: 'Premium client. Priority turnaround. Direct billing contact: accounting@netflix.com',
    status: 'active',
    activeProjectCount: 2,
    createdAt: '2022-03-15',
  },
  {
    id: 'c2',
    legalName: 'Disney Streaming Services LLC',
    displayName: 'Disney Streaming',
    companyId: 'US-46-2345678',
    timezone: 'America/Los_Angeles',
    contacts: [
      { id: 'cc3', name: 'Michael Brown', email: 'mbrown@disney.com', phone: '+1 818-560-1000', role: 'VP Localization', isPrimary: true },
    ],
    billingAddress: '500 S Buena Vista St, Burbank, CA 91521, USA',
    paymentTerms: 'net_45',
    defaultCurrency: 'USD',
    discountPercent: 5,
    discountNotes: 'Volume discount for multi-series contracts',
    preferredChannel: 'email',
    rateCard: [
      { serviceType: 'Dubbing with AI Transcript', rate: 800, currency: 'USD' },
      { serviceType: 'Subtitles Transcription AI', rate: 350, currency: 'USD' },
    ],
    status: 'active',
    activeProjectCount: 1,
    createdAt: '2022-06-20',
  },
  {
    id: 'c3',
    legalName: 'Warner Bros. Discovery, Inc.',
    displayName: 'Warner Bros.',
    companyId: 'US-13-5765432',
    timezone: 'America/New_York',
    contacts: [
      { id: 'cc4', name: 'Emily Davis', email: 'edavis@wbd.com', phone: '+1 818-954-6000', role: 'Senior Producer', isPrimary: true },
    ],
    billingAddress: '4000 Warner Blvd, Burbank, CA 91522, USA',
    paymentTerms: 'net_30',
    defaultCurrency: 'USD',
    preferredChannel: 'phone',
    rateCard: [
      { serviceType: 'Subtitles Transcription AI', rate: 400, currency: 'USD' },
      { serviceType: 'Extra QC', rate: 100, currency: 'USD' },
    ],
    status: 'active',
    activeProjectCount: 1,
    createdAt: '2023-01-10',
  },
  {
    id: 'c4',
    legalName: 'Amazon.com Services LLC',
    displayName: 'Amazon Studios',
    companyId: 'US-91-1234567',
    timezone: 'America/Los_Angeles',
    contacts: [
      { id: 'cc5', name: 'Robert Wilson', email: 'rwilson@amazon.com', phone: '+1 310-573-5500', role: 'Localization Manager', isPrimary: true },
    ],
    billingAddress: '2100 Seaport Blvd, Redwood City, CA 94063, USA',
    paymentTerms: 'net_60',
    defaultCurrency: 'USD',
    preferredChannel: 'email',
    rateCard: [],
    status: 'active',
    activeProjectCount: 1,
    createdAt: '2023-04-05',
  },
  {
    id: 'c5',
    legalName: 'Apple Inc.',
    displayName: 'Apple Inc.',
    companyId: 'US-94-2404110',
    timezone: 'America/Los_Angeles',
    contacts: [
      { id: 'cc6', name: 'Sarah Johnson', email: 'sjohnson@apple.com', phone: '+1 408-996-1010', role: 'Content Operations', isPrimary: true },
    ],
    billingAddress: 'One Apple Park Way, Cupertino, CA 95014, USA',
    paymentTerms: 'net_30',
    defaultCurrency: 'USD',
    preferredChannel: 'email',
    rateCard: [],
    status: 'active',
    activeProjectCount: 0,
    createdAt: '2023-02-28',
  },
  {
    id: 'c6',
    legalName: 'Paramount Global',
    displayName: 'Paramount Global',
    timezone: 'America/New_York',
    contacts: [
      { id: 'cc7', name: 'Lisa Chen', email: 'lchen@paramount.com', role: 'Localization Lead', isPrimary: true },
    ],
    paymentTerms: 'net_30',
    defaultCurrency: 'USD',
    preferredChannel: 'email',
    rateCard: [],
    status: 'active',
    activeProjectCount: 1,
    createdAt: '2024-01-15',
  },
  {
    id: 'c7',
    legalName: 'Old Media Corp',
    displayName: 'Old Media Corp',
    timezone: 'America/Chicago',
    contacts: [
      { id: 'cc8', name: 'John Doe', email: 'jdoe@oldmedia.com', isPrimary: true },
    ],
    paymentTerms: 'net_30',
    defaultCurrency: 'USD',
    preferredChannel: 'email',
    rateCard: [],
    status: 'archived',
    activeProjectCount: 0,
    createdAt: '2021-05-10',
    archivedAt: '2023-12-01',
  },
]

// CLIENT-002: Client Team Members
export const mockClientUsers: ClientUser[] = [
  { id: 'cu1', clientId: 'c1', name: 'Jennifer Smith', email: 'jsmith@netflix.com', phone: '+1 408-540-3700', clientRole: 'client_admin', status: 'active', invitedAt: '2022-03-15', activatedAt: '2022-03-16' },
  { id: 'cu2', clientId: 'c1', name: 'David Lee', email: 'dlee@netflix.com', clientRole: 'reviewer', status: 'active', invitedAt: '2022-04-01', activatedAt: '2022-04-02' },
  { id: 'cu3', clientId: 'c1', name: 'Anna Kim', email: 'akim@netflix.com', clientRole: 'task_owner', status: 'active', invitedAt: '2023-01-10', activatedAt: '2023-01-11' },
  { id: 'cu4', clientId: 'c1', name: 'Mark Johnson', email: 'mjohnson@netflix.com', clientRole: 'viewer', status: 'inactive', invitedAt: '2022-06-15', activatedAt: '2022-06-16', deactivatedAt: '2024-01-01' },
  { id: 'cu5', clientId: 'c2', name: 'Michael Brown', email: 'mbrown@disney.com', phone: '+1 818-560-1000', clientRole: 'client_admin', status: 'active', invitedAt: '2022-06-20', activatedAt: '2022-06-21' },
  { id: 'cu6', clientId: 'c3', name: 'Emily Davis', email: 'edavis@wbd.com', phone: '+1 818-954-6000', clientRole: 'client_admin', status: 'active', invitedAt: '2023-01-10', activatedAt: '2023-01-11' },
  { id: 'cu7', clientId: 'c4', name: 'Robert Wilson', email: 'rwilson@amazon.com', clientRole: 'client_admin', status: 'active', invitedAt: '2023-04-05', activatedAt: '2023-04-06' },
  { id: 'cu8', clientId: 'c5', name: 'Sarah Johnson', email: 'sjohnson@apple.com', clientRole: 'client_admin', status: 'active', invitedAt: '2023-02-28', activatedAt: '2023-03-01' },
  { id: 'cu9', clientId: 'c1', name: 'Pending User', email: 'pending@netflix.com', clientRole: 'viewer', status: 'pending_setup', invitedAt: '2024-02-15' },
]

export const CLIENT_ROLES: { value: string; label: string; description: string }[] = [
  { value: 'client_admin', label: 'Client Admin', description: 'Manages team, creates projects, accepts pricing' },
  { value: 'task_owner', label: 'Task Owner', description: 'Works on assigned tasks, submits completed work' },
  { value: 'reviewer', label: 'Reviewer', description: 'Reviews and approves deliverables' },
  { value: 'viewer', label: 'Viewer', description: 'View-only access to project progress' },
]

export const PAYMENT_TERMS: { value: string; label: string }[] = [
  { value: 'due_on_receipt', label: 'Due on Receipt' },
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_45', label: 'Net 45' },
  { value: 'net_60', label: 'Net 60' },
]

// VENDOR-001: Vendor Profile (all vendors are individual persons)
export const mockVendors: Vendor[] = [
  {
    id: 'v1',
    name: 'Lisa Translator',
    email: 'lisa@translatepro.com',
    phone: '+1 555-0101',
    timezone: 'America/New_York',
    location: 'New York, USA',
    paymentMethod: 'payoneer',
    paymentDetails: 'lisa@translatepro.com',
    serviceTypes: ['Translation', 'Transcription'],
    languagePairs: [
      { source: 'EN', target: 'ES' },
      { source: 'EN', target: 'PT' },
    ],
    rateCard: [
      { id: 'rc1', serviceType: 'Translation', languagePair: { source: 'EN', target: 'ES' }, rate: 10, unit: 'per_minute', currency: 'USD', rushMultiplier: 1.5 },
      { id: 'rc2', serviceType: 'Translation', languagePair: { source: 'EN', target: 'PT' }, rate: 12, unit: 'per_minute', currency: 'USD', rushMultiplier: 1.5 },
      { id: 'rc3', serviceType: 'Transcription', languagePair: { source: 'EN', target: 'ES' }, rate: 8, unit: 'per_minute', currency: 'USD' },
    ],
    availability: 'available',
    tasksDelivered: 156,
    onTimeRate: 95,
    avgTurnaroundDays: 2.3,
    activeTasks: 2,
    status: 'active',
    linkedUserId: 'u-v1',
    profileCompleted: true,
    createdAt: '2022-05-15',
    internalNotes: 'Reliable translator. Prefers morning assignments.',
  },
  {
    id: 'v2',
    name: 'Pierre Dubois',
    email: 'pierre@frenchsubs.com',
    phone: '+33 1 23 45 67 89',
    timezone: 'Europe/Paris',
    location: 'Paris, France',
    paymentMethod: 'bank_transfer',
    paymentDetails: 'FR76 3000 6000 0112 3456 7890 189',
    serviceTypes: ['Translation', 'QA'],
    languagePairs: [
      { source: 'EN', target: 'FR' },
    ],
    rateCard: [
      { id: 'rc4', serviceType: 'Translation', languagePair: { source: 'EN', target: 'FR' }, rate: 11, unit: 'per_minute', currency: 'EUR', minimum: 50, rushMultiplier: 1.75 },
      { id: 'rc5', serviceType: 'QA', languagePair: { source: 'EN', target: 'FR' }, rate: 8, unit: 'per_minute', currency: 'EUR' },
    ],
    availability: 'limited',
    blackoutPeriods: [
      { startDate: '2024-08-01', endDate: '2024-08-15', notes: 'Summer vacation' },
    ],
    tasksDelivered: 203,
    onTimeRate: 98,
    avgTurnaroundDays: 1.8,
    activeTasks: 3,
    status: 'active',
    linkedUserId: 'u-v2',
    profileCompleted: true,
    createdAt: '2021-11-20',
  },
  {
    id: 'v3',
    name: 'Maria Garcia',
    email: 'maria@adaptations.es',
    phone: '+34 612 345 678',
    timezone: 'Europe/Madrid',
    location: 'Madrid, Spain',
    paymentMethod: 'payoneer',
    serviceTypes: ['Translation', 'Review'],
    languagePairs: [
      { source: 'EN', target: 'ES' },
      { source: 'EN', target: 'IT' },
    ],
    rateCard: [
      { id: 'rc6', serviceType: 'Translation', languagePair: { source: 'EN', target: 'ES' }, rate: 9, unit: 'per_minute', currency: 'EUR' },
      { id: 'rc7', serviceType: 'Translation', languagePair: { source: 'EN', target: 'IT' }, rate: 11, unit: 'per_minute', currency: 'EUR' },
      { id: 'rc8', serviceType: 'Review', languagePair: { source: 'EN', target: 'ES' }, rate: 6, unit: 'per_minute', currency: 'EUR' },
    ],
    availability: 'available',
    tasksDelivered: 89,
    onTimeRate: 92,
    avgTurnaroundDays: 2.5,
    activeTasks: 1,
    status: 'active',
    linkedUserId: 'u-v3',
    profileCompleted: true,
    createdAt: '2023-02-10',
  },
  {
    id: 'v4',
    name: 'Hans Mueller',
    email: 'hans@qcpro.de',
    phone: '+49 30 1234567',
    timezone: 'Europe/Berlin',
    location: 'Berlin, Germany',
    paymentMethod: 'bank_transfer',
    serviceTypes: ['QA', 'Review'],
    languagePairs: [
      { source: 'EN', target: 'DE' },
      { source: 'EN', target: 'FR' },
    ],
    rateCard: [
      { id: 'rc9', serviceType: 'QA', languagePair: { source: 'EN', target: 'DE' }, rate: 10, unit: 'per_minute', currency: 'EUR' },
      { id: 'rc10', serviceType: 'Review', languagePair: { source: 'EN', target: 'DE' }, rate: 7, unit: 'per_minute', currency: 'EUR' },
    ],
    availability: 'unavailable',
    blackoutPeriods: [
      { startDate: '2024-02-20', endDate: '2024-03-05', notes: 'Medical leave' },
    ],
    tasksDelivered: 412,
    onTimeRate: 99,
    avgTurnaroundDays: 1.2,
    activeTasks: 0,
    status: 'active',
    linkedUserId: 'u-v4',
    profileCompleted: true,
    createdAt: '2020-08-01',
    internalNotes: 'Top QA specialist. Best for high-priority projects.',
  },
  {
    id: 'v5',
    name: 'Sofia Rossi',
    email: 'sofia@voiceit.it',
    timezone: 'Europe/Rome',
    location: 'Rome, Italy',
    serviceTypes: ['Transcription'],
    languagePairs: [
      { source: 'EN', target: 'IT' },
      { source: 'EN', target: 'ES' },
    ],
    rateCard: [
      { id: 'rc11', serviceType: 'Transcription', languagePair: { source: 'EN', target: 'IT' }, rate: 7, unit: 'per_minute', currency: 'EUR' },
    ],
    availability: 'available',
    tasksDelivered: 78,
    onTimeRate: 88,
    avgTurnaroundDays: 3.1,
    activeTasks: 4,
    status: 'active',
    linkedUserId: 'u-v5',
    profileCompleted: true,
    createdAt: '2023-06-15',
  },
  {
    id: 'v6',
    name: 'James Chen',
    email: 'james@translators.cn',
    timezone: 'Asia/Shanghai',
    serviceTypes: ['Translation'],
    languagePairs: [
      { source: 'EN', target: 'ZH' },
    ],
    rateCard: [],
    availability: 'available',
    tasksDelivered: 0,
    onTimeRate: 0,
    avgTurnaroundDays: 0,
    status: 'active',
    profileCompleted: false,
    createdAt: '2024-02-10',
    internalNotes: 'New vendor - pending profile setup',
  },
  {
    id: 'v7',
    name: 'Old Vendor',
    email: 'old@retired.com',
    timezone: 'America/Chicago',
    serviceTypes: ['Translation'],
    languagePairs: [{ source: 'EN', target: 'ES' }],
    rateCard: [],
    availability: 'unavailable',
    tasksDelivered: 45,
    onTimeRate: 85,
    avgTurnaroundDays: 4.0,
    status: 'archived',
    profileCompleted: true,
    createdAt: '2019-01-10',
    archivedAt: '2023-06-01',
  },
]

export const VENDOR_SERVICE_TYPES = ['Transcription', 'Translation', 'QA', 'Review']

export const VENDOR_AVAILABILITY_OPTIONS: { value: string; label: string; dot: string }[] = [
  { value: 'available', label: 'Available', dot: 'bg-green-500' },
  { value: 'limited', label: 'Limited', dot: 'bg-yellow-500' },
  { value: 'unavailable', label: 'Unavailable', dot: 'bg-red-500' },
]

export const LANGUAGE_PAIRS = [
  { source: 'EN', target: 'ES', label: 'EN → ES' },
  { source: 'EN', target: 'FR', label: 'EN → FR' },
  { source: 'EN', target: 'DE', label: 'EN → DE' },
  { source: 'EN', target: 'IT', label: 'EN → IT' },
  { source: 'EN', target: 'PT', label: 'EN → PT' },
  { source: 'EN', target: 'ZH', label: 'EN → ZH' },
  { source: 'EN', target: 'JA', label: 'EN → JA' },
  { source: 'EN', target: 'KO', label: 'EN → KO' },
  { source: 'EN', target: 'HE', label: 'EN → HE' },
  { source: 'EN', target: 'AR', label: 'EN → AR' },
  { source: 'ES', target: 'EN', label: 'ES → EN' },
  { source: 'FR', target: 'EN', label: 'FR → EN' },
  { source: 'DE', target: 'EN', label: 'DE → EN' },
]

// NOTIF-001: In-App Notifications
export const mockNotifications: Notification[] = [
  // Today
  { id: 'n1', userId: '2', type: 'task_submitted', category: 'tasks', title: 'Task Submitted', preview: 'Lisa Translator submitted Episode 1 - Subtitling ES', entityType: 'task', entityId: 't1', entityUrl: '/tasks/t1', isRead: false, createdAt: new Date().toISOString() },
  { id: 'n2', userId: '2', type: 'blocker_flagged', category: 'tasks', title: 'Blocker Flagged', preview: 'Pierre Dubois flagged a blocker on Episode 1 - Subtitling FR', entityType: 'task', entityId: 't2', entityUrl: '/tasks/t2', isRead: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'n3', userId: '5', type: 'invoice_overdue', category: 'billing', title: 'Invoice Overdue', preview: 'Invoice INV-2024-003 for Netflix is 5 days overdue', entityType: 'invoice', entityId: 'inv3', entityUrl: '/billing/invoices/inv3', isRead: false, createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  // Earlier
  { id: 'n4', userId: '2', type: 'vendor_accepted_offer', category: 'tasks', title: 'Vendor Accepted Offer', preview: 'Maria Garcia accepted Pilot - Script Adaptation', entityType: 'task', entityId: 't4', entityUrl: '/tasks/t4', isRead: true, createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
  { id: 'n5', userId: '3', type: 'quote_sent', category: 'projects', title: 'New Quote', preview: 'New quote from NG Broadcast for Amazon Prime Feature Film', entityType: 'quote', entityId: 'q1', entityUrl: '/quotes/q1', isRead: false, createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString() },
  { id: 'n6', userId: '2', type: 'task_complete', category: 'tasks', title: 'Task Complete', preview: 'Final QC Review completed for HBO Max Documentary', entityType: 'task', entityId: 't6', entityUrl: '/tasks/t6', isRead: true, createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
  { id: 'n7', userId: '4', type: 'payment_processed', category: 'billing', title: 'Payment Processed', preview: 'Payment of $450 has been processed', entityType: 'vendor', entityId: 'v1', entityUrl: '/billing/vendor-payments', isRead: true, createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() },
  { id: 'n8', userId: '1', type: 'services_catalog_updated', category: 'system', title: 'Services Catalog Updated', preview: 'Mike Manager updated services/workflows. New projects will use the updated defaults.', entityUrl: '/settings/services', isRead: false, createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString() },
  { id: 'n9', userId: '6', type: 'system_alert', category: 'system', title: 'Editor Integration Issue', preview: 'Editor integration is unreachable. Tasks may not sync.', entityUrl: '/settings/editor-integration', isRead: true, createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString() },
  { id: 'n10', userId: '4', type: 'task_assigned', category: 'tasks', title: 'New Task Assigned', preview: 'You have been assigned Episode 1 - Subtitling ES', entityType: 'task', entityId: 't1', entityUrl: '/tasks/t1', isRead: true, createdAt: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString() },
  { id: 'n11', userId: '2', type: 'task_overdue', category: 'tasks', title: 'Task Overdue', preview: 'Episode 2 - Subtitling ES is overdue', entityType: 'task', entityId: 't7', entityUrl: '/tasks/t7', isRead: false, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n12', userId: '5', type: 'invoice_paid', category: 'billing', title: 'Invoice Paid', preview: 'Invoice INV-2024-001 has been paid', entityType: 'invoice', entityId: 'inv1', entityUrl: '/billing/invoices/inv1', isRead: true, createdAt: new Date(Date.now() - 200 * 60 * 60 * 1000).toISOString() },
  { id: 'n13', userId: '2', type: 'project_delivered', category: 'projects', title: 'Project Delivered', preview: 'Apple TV+ Mini Series has been marked as delivered', entityType: 'project', entityId: 'p5', entityUrl: '/projects/p5', isRead: true, createdAt: new Date(Date.now() - 240 * 60 * 60 * 1000).toISOString() },
  { id: 'n14', userId: '4', type: 'task_offer', category: 'tasks', title: 'New Task Offer', preview: 'New task offer: Translation - EN > ES', entityUrl: '/task-offers', isRead: false, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  // NOTIF-004: System digest alerts
  { id: 'n15', userId: '2', type: 'tasks_overdue_digest', category: 'system', title: 'Daily Overdue Tasks', preview: '3 tasks are overdue by more than 24 hours.', entityUrl: '/tasks?filter=overdue', isRead: false, createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  { id: 'n16', userId: '5', type: 'invoices_overdue_digest', category: 'system', title: 'Weekly Overdue Invoices', preview: '2 invoices are overdue by more than 30 days.', entityUrl: '/billing/invoices?filter=overdue', isRead: false, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
]

// NOTIF-001: Notification Type Icons and Colors
export const NOTIFICATION_TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  task_assigned: { icon: 'ClipboardList', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  task_submitted: { icon: 'CheckCircle2', color: 'text-green-600', bgColor: 'bg-green-100' },
  task_overdue: { icon: 'AlertTriangle', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  task_rework: { icon: 'RotateCcw', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  task_complete: { icon: 'CheckCircle2', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  blocker_flagged: { icon: 'Flag', color: 'text-red-600', bgColor: 'bg-red-100' },
  task_offer: { icon: 'Mail', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  vendor_accepted_offer: { icon: 'Handshake', color: 'text-teal-600', bgColor: 'bg-teal-100' },
  client_message: { icon: 'MessageSquare', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  quote_sent: { icon: 'FileText', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  quote_approved: { icon: 'ThumbsUp', color: 'text-green-600', bgColor: 'bg-green-100' },
  quote_rejected: { icon: 'ThumbsDown', color: 'text-red-600', bgColor: 'bg-red-100' },
  quote_changes_requested: { icon: 'MessageCircle', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  invoice_sent: { icon: 'Send', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  invoice_overdue: { icon: 'AlertCircle', color: 'text-red-600', bgColor: 'bg-red-100' },
  invoice_paid: { icon: 'DollarSign', color: 'text-green-600', bgColor: 'bg-green-100' },
  payment_processed: { icon: 'CreditCard', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  project_delivered: { icon: 'Package', color: 'text-teal-600', bgColor: 'bg-teal-100' },
  account_invite: { icon: 'UserPlus', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  password_reset: { icon: 'KeyRound', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  role_changed: { icon: 'Shield', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  services_catalog_updated: { icon: 'Settings', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  system_alert: { icon: 'AlertOctagon', color: 'text-red-600', bgColor: 'bg-red-100' },
  // NOTIF-004: Digest notification types
  tasks_overdue_digest: { icon: 'AlertTriangle', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  invoices_overdue_digest: { icon: 'AlertCircle', color: 'text-red-600', bgColor: 'bg-red-100' },
}

// NOTIF-003: Default Notification Preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreference[] = [
  // Tasks
  { type: 'task_assigned', category: 'tasks', label: 'Task assigned to me', inApp: true, email: true },
  { type: 'task_submitted', category: 'tasks', label: 'Task submitted for review', inApp: true, email: true },
  { type: 'task_overdue', category: 'tasks', label: 'Task overdue', inApp: true, email: true },
  { type: 'task_rework', category: 'tasks', label: 'Task sent back for rework', inApp: true, email: true },
  { type: 'task_complete', category: 'tasks', label: 'Task completed', inApp: true, email: true },
  { type: 'blocker_flagged', category: 'tasks', label: 'Blocker flagged', inApp: true, email: true },
  { type: 'task_offer', category: 'tasks', label: 'New task offer (Vendors)', inApp: true, email: true },
  { type: 'vendor_accepted_offer', category: 'tasks', label: 'Vendor accepted offer', inApp: true, email: true },
  // Projects
  { type: 'quote_sent', category: 'projects', label: 'Quote sent', inApp: true, email: true },
  { type: 'quote_approved', category: 'projects', label: 'Quote approved', inApp: true, email: true },
  { type: 'quote_rejected', category: 'projects', label: 'Quote rejected', inApp: true, email: true },
  { type: 'quote_changes_requested', category: 'projects', label: 'Quote changes requested', inApp: true, email: true },
  { type: 'project_delivered', category: 'projects', label: 'Project delivered', inApp: true, email: true },
  { type: 'client_message', category: 'projects', label: 'New client message', inApp: true, email: true },
  // Billing
  { type: 'invoice_sent', category: 'billing', label: 'Invoice sent', inApp: true, email: true },
  { type: 'invoice_overdue', category: 'billing', label: 'Invoice overdue', inApp: true, email: true },
  { type: 'invoice_paid', category: 'billing', label: 'Invoice paid', inApp: true, email: true },
  { type: 'payment_processed', category: 'billing', label: 'Payment processed (Vendors)', inApp: true, email: true },
  // System
  { type: 'services_catalog_updated', category: 'system', label: 'Services catalog updated', inApp: true, email: true },
  { type: 'system_alert', category: 'system', label: 'System alerts', inApp: true, email: true },
  // NOTIF-004: Digest alerts (Admin/PM/Finance)
  { type: 'tasks_overdue_digest', category: 'system', label: 'Daily overdue tasks digest (PM)', inApp: true, email: true },
  { type: 'invoices_overdue_digest', category: 'system', label: 'Weekly overdue invoices digest (Finance/Admin)', inApp: true, email: true },
  // Account (critical - always on)
  { type: 'account_invite', category: 'account', label: 'Account invite', inApp: true, email: true, isAlwaysOn: true },
  { type: 'password_reset', category: 'account', label: 'Password reset', inApp: true, email: true, isAlwaysOn: true },
  { type: 'role_changed', category: 'account', label: 'Role changed', inApp: true, email: true, isAlwaysOn: true },
]

// SERV-001: Services Catalog (all 17 services from PRD)
export const SERVICE_CATEGORIES: { value: string; label: string }[] = [
  { value: 'transcription', label: 'Transcription Services' },
  { value: 'translation', label: 'Translation Services' },
  { value: 'editing_qc', label: 'Editing & Quality Control' },
  { value: 'technical', label: 'Technical & Special Services' },
  { value: 'billing_only', label: 'Administrative / Billing Only' },
]

export const WORKFLOW_STEP_TYPES: { value: string; label: string; isHumanOnly?: boolean }[] = [
  { value: 'transcription', label: 'Transcription' },
  { value: 'timing', label: 'Timing' },
  { value: 'translation', label: 'Translation' },
  { value: 'qc', label: 'QC', isHumanOnly: true },
  { value: 'qc2', label: 'QC2', isHumanOnly: true },
  { value: 'pm_verification', label: 'PM Verification' },
  { value: 'client_review', label: 'Client Review' },
  { value: 'upload', label: 'Upload' },
  { value: 'other', label: 'Other' },
]

export const PRICING_MODELS: { value: string; label: string }[] = [
  { value: 'per_minute', label: 'Per minute of video' },
  { value: 'per_subtitle', label: 'Per subtitle / per line' },
  { value: 'per_file', label: 'Per file / fixed fee' },
  { value: 'custom', label: 'Custom (manual price per project)' },
]

// Update PROJ-001: Shows (top-level entity that groups Scenes/Projects)
export interface Show {
  id: string
  name: string
  clientId: string
  clientName: string
  description?: string
  createdAt: string
  sceneCount: number
}

export const mockShows: Show[] = [
  { id: 'show-1', name: 'Stranger Things', clientId: 'c1', clientName: 'Netflix Inc.', description: 'Sci-fi horror drama series', createdAt: '2025-01-15T10:00:00Z', sceneCount: 12 },
  { id: 'show-2', name: 'The Crown', clientId: 'c1', clientName: 'Netflix Inc.', description: 'Historical drama series', createdAt: '2025-02-20T14:00:00Z', sceneCount: 8 },
  { id: 'show-3', name: 'Moana 2', clientId: 'c2', clientName: 'Disney Studios', description: 'Animated feature film', createdAt: '2025-03-10T09:00:00Z', sceneCount: 3 },
  { id: 'show-4', name: 'The Bear', clientId: 'c1', clientName: 'Netflix Inc.', description: 'Drama comedy series', createdAt: '2025-04-01T11:00:00Z', sceneCount: 6 },
  { id: 'show-5', name: 'House of the Dragon', clientId: 'c3', clientName: 'HBO Max', description: 'Fantasy drama series', createdAt: '2025-04-15T08:00:00Z', sceneCount: 10 },
  { id: 'show-6', name: 'Foundation', clientId: 'c-apple', clientName: 'Apple Inc.', description: 'Sci-fi drama series', createdAt: '2025-05-01T10:00:00Z', sceneCount: 4 },
  { id: 'show-7', name: 'Severance', clientId: 'c-apple', clientName: 'Apple Inc.', description: 'Thriller drama series', createdAt: '2025-05-10T12:00:00Z', sceneCount: 7 },
  { id: 'show-8', name: 'The Mandalorian', clientId: 'c2', clientName: 'Disney Studios', description: 'Star Wars series', createdAt: '2025-06-01T10:00:00Z', sceneCount: 16 },
  { id: 'show-9', name: 'True Detective', clientId: 'c3', clientName: 'HBO Max', description: 'Crime drama anthology', createdAt: '2025-07-15T09:00:00Z', sceneCount: 8 },
]

// PROJ-013: Project Templates
export interface ProjectTemplate {
  id: string
  name: string
  clientId: string
  clientName: string
  showId?: string
  showName?: string
  languages: { source: string; target: string }[]
  workflow: { serviceType: string; order: number }[]
  preferredVendors: { serviceType: string; language: string; vendorId: string; vendorName: string }[]
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  internalNotes?: string
  createdAt: string
  updatedAt: string
  ownerId: string
  ownerName: string
  usageCount: number
  lastUsedAt?: string
}

export const mockProjectTemplates: ProjectTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Netflix Series - Standard Subtitles',
    clientId: 'c1',
    clientName: 'Netflix Inc.',
    showId: 'show-1',
    showName: 'Stranger Things',
    languages: [
      { source: 'EN', target: 'ES' },
      { source: 'EN', target: 'FR' },
      { source: 'EN', target: 'DE' },
    ],
    workflow: [
      { serviceType: 'Transcription', order: 1 },
      { serviceType: 'Timing', order: 2 },
      { serviceType: 'Translation', order: 3 },
      { serviceType: 'QC', order: 4 },
      { serviceType: 'PM Verification', order: 5 },
    ],
    preferredVendors: [
      { serviceType: 'Transcription', language: 'ES', vendorId: 'v1', vendorName: 'Lisa Translator' },
      { serviceType: 'Translation', language: 'ES', vendorId: 'v1', vendorName: 'Lisa Translator' },
      { serviceType: 'Translation', language: 'FR', vendorId: 'v2', vendorName: 'Pierre Dubois' },
    ],
    priority: 'high',
    internalNotes: 'Standard workflow for Netflix series. Always use qualified vendors.',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-04-20T14:30:00Z',
    ownerId: '1',
    ownerName: 'Sarah L.',
    usageCount: 24,
    lastUsedAt: '2026-04-28T09:15:00Z',
  },
  {
    id: 'tpl-2',
    name: 'Disney+ Feature Film',
    clientId: 'c2',
    clientName: 'Disney Studios',
    languages: [
      { source: 'EN', target: 'ES' },
      { source: 'EN', target: 'PT' },
    ],
    workflow: [
      { serviceType: 'Transcription AI', order: 1 },
      { serviceType: 'QC', order: 2 },
      { serviceType: 'Translation', order: 3 },
      { serviceType: 'Proofread', order: 4 },
      { serviceType: 'PM Verification', order: 5 },
      { serviceType: 'Client Review', order: 6 },
    ],
    preferredVendors: [
      { serviceType: 'QC', language: 'ES', vendorId: 'v3', vendorName: 'Maria Garcia' },
      { serviceType: 'Translation', language: 'PT', vendorId: 'v2', vendorName: 'Pierre Dubois' },
    ],
    priority: 'urgent',
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-04-15T11:00:00Z',
    ownerId: '2',
    ownerName: 'Mike Manager',
    usageCount: 8,
    lastUsedAt: '2026-04-25T16:45:00Z',
  },
  {
    id: 'tpl-3',
    name: 'HBO Documentary - Hebrew',
    clientId: 'c3',
    clientName: 'HBO Max',
    showId: 'show-3',
    showName: 'Documentary Collection',
    languages: [
      { source: 'EN', target: 'HE' },
    ],
    workflow: [
      { serviceType: 'Transcription', order: 1 },
      { serviceType: 'Timing', order: 2 },
      { serviceType: 'Translation', order: 3 },
      { serviceType: 'QC', order: 4 },
    ],
    preferredVendors: [],
    priority: 'medium',
    internalNotes: 'Hebrew localization requires specific timing guidelines.',
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: '2026-03-01T12:00:00Z',
    ownerId: '1',
    ownerName: 'Sarah L.',
    usageCount: 3,
  },
  {
    id: 'tpl-4',
    name: 'Apple TV+ Drama - Multi-Language',
    clientId: 'c-apple',
    clientName: 'Apple Inc.',
    languages: [
      { source: 'EN', target: 'ES' },
      { source: 'EN', target: 'FR' },
      { source: 'EN', target: 'DE' },
      { source: 'EN', target: 'IT' },
      { source: 'EN', target: 'PT' },
    ],
    workflow: [
      { serviceType: 'Transcription', order: 1 },
      { serviceType: 'Timing', order: 2 },
      { serviceType: 'Translation', order: 3 },
      { serviceType: 'PM Verification', order: 4 },
      { serviceType: 'Client Review', order: 5 },
    ],
    preferredVendors: [
      { serviceType: 'Transcription', language: 'ES', vendorId: 'v1', vendorName: 'Lisa Translator' },
    ],
    priority: 'high',
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-04-28T10:00:00Z',
    ownerId: '1',
    ownerName: 'Sarah L.',
    usageCount: 5,
    lastUsedAt: '2026-04-29T08:30:00Z',
  },
]

export const mockServices: Service[] = [
  // Transcription Services
  {
    id: 'srv1',
    name: 'Subtitles Transcription',
    category: 'transcription',
    pricingModel: 'per_minute',
    defaultBaseRate: 8,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w1-1', name: 'Transcription', type: 'transcription', description: 'Transcribing source language by ear directly from the video', order: 1 },
      { id: 'w1-2', name: 'Timing', type: 'timing', description: 'Manual human timing', order: 2 },
      { id: 'w1-3', name: 'PM Verification', type: 'pm_verification', description: 'Project Manager review for quality and client requirements', order: 3 },
      { id: 'w1-4', name: 'Client Review', type: 'client_review', description: 'Final approval by the client', order: 4 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  {
    id: 'srv2',
    name: 'Subtitles Transcription AI',
    category: 'transcription',
    pricingModel: 'per_minute',
    defaultBaseRate: 5,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w2-1', name: 'Transcription + Timing AI', type: 'other', description: 'Automated generation of text and timecodes', order: 1 },
      { id: 'w2-2', name: 'QC', type: 'qc', description: 'Human proofreading and correction of the AI-generated file', isHumanOnly: true, order: 2 },
      { id: 'w2-3', name: 'PM Verification', type: 'pm_verification', description: 'Project Manager review', order: 3 },
      { id: 'w2-4', name: 'Client Review', type: 'client_review', description: 'Final approval by the client', order: 4 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  // Translation Services
  {
    id: 'srv3',
    name: 'Translation from Audio + Template',
    category: 'translation',
    pricingModel: 'per_minute',
    defaultBaseRate: 12,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w3-1', name: 'Transcription', type: 'transcription', description: 'Transcribing the source language', order: 1 },
      { id: 'w3-2', name: 'Timing', type: 'timing', description: 'Timing the source text', order: 2 },
      { id: 'w3-3', name: 'Translation', type: 'translation', description: 'Translating the source language to the target language on existing timecodes', order: 3 },
      { id: 'w3-4', name: 'QC', type: 'qc', description: 'Quality control / proofreading', isHumanOnly: true, order: 4 },
      { id: 'w3-5', name: 'PM Verification', type: 'pm_verification', description: 'Project Manager review', order: 5 },
      { id: 'w3-6', name: 'Client Review', type: 'client_review', description: 'Final approval by the client', order: 6 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  {
    id: 'srv4',
    name: 'Translation from Audio',
    category: 'translation',
    pricingModel: 'per_minute',
    defaultBaseRate: 10,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w4-1', name: 'Translation from Audio', type: 'translation', description: 'Direct translation from audio to target language (no source template)', order: 1 },
      { id: 'w4-2', name: 'Timing', type: 'timing', description: 'Timing the translated text', order: 2 },
      { id: 'w4-3', name: 'PM Verification', type: 'pm_verification', description: 'Project Manager review', order: 3 },
      { id: 'w4-4', name: 'Client Review', type: 'client_review', description: 'Final approval by the client', order: 4 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  {
    id: 'srv5',
    name: 'Translation from Audio + Template AI',
    category: 'translation',
    pricingModel: 'per_minute',
    defaultBaseRate: 8,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w5-1', name: 'Transcription + Timing AI', type: 'other', description: 'Automated source text and timing', order: 1 },
      { id: 'w5-2', name: 'QC', type: 'qc', description: 'Human review of the source material', isHumanOnly: true, order: 2 },
      { id: 'w5-3', name: 'Translation AI', type: 'translation', description: 'Automated translation to the target language', order: 3 },
      { id: 'w5-4', name: 'QC', type: 'qc', description: 'Human review of the translation', isHumanOnly: true, order: 4 },
      { id: 'w5-5', name: 'PM Verification', type: 'pm_verification', description: 'Project Manager review', order: 5 },
      { id: 'w5-6', name: 'Client Review', type: 'client_review', description: 'Final approval by the client', order: 6 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  {
    id: 'srv6',
    name: 'Translation from Template AI',
    category: 'translation',
    pricingModel: 'per_minute',
    defaultBaseRate: 6,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w6-1', name: 'Upload TT', type: 'upload', description: 'Uploading the existing source language Timed Text template', order: 1 },
      { id: 'w6-2', name: 'Translation AI', type: 'translation', description: 'Automated translation', order: 2 },
      { id: 'w6-3', name: 'QC', type: 'qc', description: 'First round of human quality control', isHumanOnly: true, order: 3 },
      { id: 'w6-4', name: 'QC2', type: 'qc2', description: 'Second round of human quality control', isHumanOnly: true, order: 4 },
      { id: 'w6-5', name: 'PM Verification', type: 'pm_verification', description: 'Project Manager review', order: 5 },
      { id: 'w6-6', name: 'Client Review', type: 'client_review', description: 'Final approval by the client', order: 6 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  {
    id: 'srv7',
    name: 'Text Translation',
    category: 'translation',
    pricingModel: 'per_file',
    defaultBaseRate: 100,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w7-1', name: 'Upload Text File', type: 'upload', description: 'Uploading Word, PDF, or Presentation files', order: 1 },
      { id: 'w7-2', name: 'Translation', type: 'translation', description: 'Translating the text content', order: 2 },
      { id: 'w7-3', name: 'PM Verification', type: 'pm_verification', description: 'Project Manager review', order: 3 },
      { id: 'w7-4', name: 'Client Review', type: 'client_review', description: 'Final approval by the client', order: 4 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  {
    id: 'srv8',
    name: 'Translation Pivot Language',
    category: 'translation',
    pricingModel: 'per_minute',
    defaultBaseRate: 15,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w8-1', name: 'Translation from Audio', type: 'translation', description: 'Translating from Source Language to English', order: 1 },
      { id: 'w8-2', name: 'Timing', type: 'timing', description: 'Timing the English subtitles', order: 2 },
      { id: 'w8-3', name: 'Translation', type: 'translation', description: 'Translating from English to the final Target Language', order: 3 },
      { id: 'w8-4', name: 'PM Verification', type: 'pm_verification', description: 'Project Manager review', order: 4 },
      { id: 'w8-5', name: 'Client Review', type: 'client_review', description: 'Final approval by the client', order: 5 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  // Editing & Quality Control
  {
    id: 'srv9',
    name: 'Proofread',
    category: 'editing_qc',
    pricingModel: 'per_minute',
    defaultBaseRate: 4,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w9-1', name: 'Proofread', type: 'qc', description: 'Linguistic editing of a provided text', isHumanOnly: true, order: 1 },
      { id: 'w9-2', name: 'PM Verification', type: 'pm_verification', description: 'Project Manager review', order: 2 },
      { id: 'w9-3', name: 'Client Review', type: 'client_review', description: 'Final approval by the client', order: 3 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  {
    id: 'srv10',
    name: 'Extra QC',
    category: 'editing_qc',
    pricingModel: 'per_minute',
    defaultBaseRate: 3,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w10-1', name: 'Upload Client Asset', type: 'upload', description: 'Uploading the existing subtitle file', order: 1 },
      { id: 'w10-2', name: 'QC', type: 'qc', description: 'Sending to an additional transcriber/translator for a new review', isHumanOnly: true, order: 2 },
      { id: 'w10-3', name: 'PM Verification', type: 'pm_verification', description: 'Project Manager review', order: 3 },
      { id: 'w10-4', name: 'Client Review', type: 'client_review', description: 'Final approval by the client', order: 4 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  // Technical & Special Services
  {
    id: 'srv11',
    name: 'Timing',
    category: 'technical',
    pricingModel: 'per_minute',
    defaultBaseRate: 5,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w11-1', name: 'Transcription', type: 'upload', description: 'Uploading existing transcription to the system', order: 1 },
      { id: 'w11-2', name: 'Timing', type: 'timing', description: 'Adding timecodes to the uploaded text', order: 2 },
      { id: 'w11-3', name: 'PM Verification', type: 'pm_verification', description: 'Project Manager review', order: 3 },
      { id: 'w11-4', name: 'Client Review', type: 'client_review', description: 'Final approval by the client', order: 4 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  {
    id: 'srv12',
    name: 'Client Corrections',
    category: 'technical',
    pricingModel: 'per_file',
    defaultBaseRate: 50,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w12-1', name: 'Upload Client Asset', type: 'upload', description: 'Uploading the client video and subtitle file', order: 1 },
      { id: 'w12-2', name: 'Client Review', type: 'client_review', description: 'Reviewing the assets within the system', order: 2 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  {
    id: 'srv13',
    name: 'New Version (Re-conforming)',
    category: 'technical',
    pricingModel: 'per_minute',
    defaultBaseRate: 6,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w13-1', name: 'Upload Rough Cut', type: 'upload', description: 'Uploading the old subtitle file', order: 1 },
      { id: 'w13-2', name: 'New Cut', type: 'other', description: 'Adjusting text and timing to match the new video version', order: 2 },
      { id: 'w13-3', name: 'PM Verification', type: 'pm_verification', description: 'Project Manager review', order: 3 },
      { id: 'w13-4', name: 'Client Review', type: 'client_review', description: 'Final approval by the client', order: 4 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  {
    id: 'srv14',
    name: 'Convert Files',
    category: 'technical',
    pricingModel: 'per_file',
    defaultBaseRate: 25,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w14-1', name: 'PM Verification', type: 'pm_verification', description: 'Verification of converted format (e.g., SRT to PAC) or frame rate', order: 1 },
      { id: 'w14-2', name: 'Client Review', type: 'client_review', description: 'Final approval by the client', order: 2 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  {
    id: 'srv15',
    name: 'Other',
    category: 'technical',
    pricingModel: 'custom',
    defaultBaseRate: 0,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w15-1', name: 'PM Verification', type: 'pm_verification', description: 'Project Manager review', order: 1 },
      { id: 'w15-2', name: 'Client Review', type: 'client_review', description: 'Final approval by the client', order: 2 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  // Administrative / Billing Only
  {
    id: 'srv16',
    name: 'Raw Materials',
    category: 'billing_only',
    pricingModel: 'custom',
    defaultBaseRate: 0,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w16-1', name: 'Project Creation', type: 'other', description: 'Setting up the project for billing purposes only (work is performed outside the main system)', order: 1 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
  {
    id: 'srv17',
    name: 'Translation On-Site',
    category: 'billing_only',
    pricingModel: 'custom',
    defaultBaseRate: 0,
    rateCurrency: 'USD',
    workflow: [
      { id: 'w17-1', name: 'Project Creation', type: 'other', description: 'Setting up the project for billing purposes (translator sent to external studios)', order: 1 },
    ],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10',
  },
]

// SERV-002: Translation Rate Card (Language Pair Pricing)
export const mockTranslationRateCard: TranslationRateCardEntry[] = [
  { id: 'trc1', sourceLanguage: 'EN', targetLanguage: 'ES', rate: 10, rateUnit: 'per_minute', currency: 'USD', effectiveDate: '2024-01-01', notes: 'Standard rate' },
  { id: 'trc2', sourceLanguage: 'EN', targetLanguage: 'FR', rate: 11, rateUnit: 'per_minute', currency: 'USD', effectiveDate: '2024-01-01' },
  { id: 'trc3', sourceLanguage: 'EN', targetLanguage: 'DE', rate: 12, rateUnit: 'per_minute', currency: 'USD', effectiveDate: '2024-01-01' },
  { id: 'trc4', sourceLanguage: 'EN', targetLanguage: 'IT', rate: 11, rateUnit: 'per_minute', currency: 'USD', effectiveDate: '2024-01-01' },
  { id: 'trc5', sourceLanguage: 'EN', targetLanguage: 'PT', rate: 10, rateUnit: 'per_minute', currency: 'USD', effectiveDate: '2024-01-01' },
  { id: 'trc6', sourceLanguage: 'EN', targetLanguage: 'ZH', rate: 15, rateUnit: 'per_minute', currency: 'USD', effectiveDate: '2024-01-01', notes: 'Premium rate for Chinese' },
  { id: 'trc7', sourceLanguage: 'EN', targetLanguage: 'JA', rate: 15, rateUnit: 'per_minute', currency: 'USD', effectiveDate: '2024-01-01', notes: 'Premium rate for Japanese' },
  { id: 'trc8', sourceLanguage: 'EN', targetLanguage: 'KO', rate: 14, rateUnit: 'per_minute', currency: 'USD', effectiveDate: '2024-01-01' },
  { id: 'trc9', sourceLanguage: 'EN', targetLanguage: 'AR', rate: 13, rateUnit: 'per_minute', currency: 'USD', effectiveDate: '2024-01-01' },
  { id: 'trc10', sourceLanguage: 'EN', targetLanguage: 'HE', rate: 12, rateUnit: 'per_minute', currency: 'USD', effectiveDate: '2024-01-01' },
  { id: 'trc11', sourceLanguage: 'ES', targetLanguage: 'EN', rate: 10, rateUnit: 'per_minute', currency: 'USD', effectiveDate: '2024-01-01' },
  { id: 'trc12', sourceLanguage: 'FR', targetLanguage: 'EN', rate: 11, rateUnit: 'per_minute', currency: 'USD', effectiveDate: '2024-01-01' },
]

// SERV-002: Per-Minute Video Rates
export const mockVideoMinuteRates: VideoMinuteRate[] = [
  {
    id: 'vmr1',
    currency: 'USD',
    defaultRate: 8,
    tiers: [
      { minMinutes: 0, maxMinutes: 30, rate: 10 },
      { minMinutes: 31, maxMinutes: 60, rate: 8 },
      { minMinutes: 61, maxMinutes: 999999, rate: 6 },
    ],
    updatedAt: '2024-01-01',
  },
  {
    id: 'vmr2',
    currency: 'EUR',
    defaultRate: 7,
    tiers: [
      { minMinutes: 0, maxMinutes: 30, rate: 9 },
      { minMinutes: 31, maxMinutes: 60, rate: 7 },
      { minMinutes: 61, maxMinutes: 999999, rate: 5 },
    ],
    updatedAt: '2024-01-01',
  },
  {
    id: 'vmr3',
    currency: 'ILS',
    defaultRate: 30,
    updatedAt: '2024-01-01',
  },
]

export const mockDashboardStats: DashboardStats = {
  totalProjects: 24,
  activeProjects: 8,
  completedProjects: 14,
  totalRevenue: 2510000,
  pendingPayments: 122500,
  overdueInvoices: 2,
  activeVendors: 18,
  pendingTasks: 45,
}

export function formatCurrency(amount: number, currency: 'USD' | 'ILS' | 'EUR' = 'ILS'): string {
  // Use en-US locale for all currencies to ensure symbol is on the left
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC', // Use UTC to prevent hydration mismatch
  })
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC', // Use UTC to prevent hydration mismatch
  })
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Project statuses (PROJ-002)
    draft: 'bg-muted text-muted-foreground',
    quoted: 'bg-amber-100 text-amber-800 border border-amber-200',
    approved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border border-yellow-200', // Yellow per TASK-002 spec (shared with tasks)
    in_review: 'bg-purple-100 text-purple-800 border border-purple-200',
    delivered: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
    invoiced: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    closed: 'bg-gray-100 text-gray-800 border border-gray-200',
    cancelled: 'bg-red-100 text-red-800 border border-red-200',
    // Task statuses (TASK-002) - Note: in_progress uses project color (blue) above
    // Task-specific statuses that don't conflict with project statuses:
    unassigned: 'bg-gray-100 text-gray-800 border border-gray-200',
    open_for_offers: 'bg-orange-100 text-orange-800 border border-orange-200',
    assigned: 'bg-blue-100 text-blue-800 border border-blue-200',
    submitted: 'bg-purple-100 text-purple-800 border border-purple-200',
    complete: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    // Quote statuses (QUOTE-002)
    unsent: 'bg-gray-50 text-gray-600 border border-gray-200',
    sent: 'bg-blue-100 text-blue-800 border border-blue-200',
    changes_requested: 'bg-amber-100 text-amber-800 border border-amber-200',
    rejected: 'bg-red-100 text-red-800 border border-red-200',
    superseded: 'bg-gray-200 text-gray-700 border border-gray-300',
    // Update 02: Changed from moved_to_project to moved_to_show
    moved_to_show: 'bg-teal-100 text-teal-800 border border-teal-200',
    // Invoice statuses (BILL-002)
    paid: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    sent: 'bg-blue-100 text-blue-800 border border-blue-200',
    viewed: 'bg-purple-100 text-purple-800 border border-purple-200',
    overdue: 'bg-red-100 text-red-800 border border-red-200',
    // Vendor payment statuses (BILL-004/005)
    pending: 'bg-amber-100 text-amber-800 border border-amber-200',
    // Vendor statuses (VENDOR-001)
    active: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    archived: 'bg-gray-100 text-gray-600 border border-gray-200',
    // Vendor statuses
    available: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    busy: 'bg-amber-100 text-amber-800 border border-amber-200',
    inactive: 'bg-muted text-muted-foreground',
    active: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    on_hold: 'bg-amber-100 text-amber-800 border border-amber-200',
  }
  return colors[status] || 'bg-muted text-muted-foreground'
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700',
    urgent: 'bg-red-100 text-red-700',
  }
  return colors[priority] || 'bg-gray-100 text-gray-700'
}

export const PROJECT_STATUSES: { value: string; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
]
