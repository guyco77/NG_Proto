// USER-001: User Roles and Status
export type UserRole = 'admin' | 'pm' | 'client' | 'vendor' | 'finance' | 'it'
export type UserStatus = 'active' | 'inactive' | 'pending_setup'
export type UserEntityType = 'internal' | 'client' | 'vendor'

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
  avatar?: string
  // Entity association (for Client/Vendor roles)
  entityType: UserEntityType
  linkedEntityId?: string // client or vendor ID
  linkedEntityName?: string // client or vendor display name
  // Status
  status: UserStatus
  // Timestamps
  createdAt: string
  lastLoginAt?: string
  // SSO
  isSSOOnly?: boolean
}

export type ProjectStatus = 'draft' | 'quoted' | 'approved' | 'in_progress' | 'in_review' | 'delivered' | 'invoiced' | 'closed' | 'cancelled'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent'
export type NoteVisibility = 'internal' | 'client' | 'vendor' | 'billing'
export type TaskStatus = 'unassigned' | 'open_for_offers' | 'assigned' | 'in_progress' | 'submitted' | 'complete'
// Update 02: Approved quote → Show (not Project)
export type QuoteStatus = 'unsent' | 'draft' | 'sent' | 'changes_requested' | 'approved' | 'rejected' | 'superseded' | 'moved_to_show'
export type QuoteCurrency = 'ILS' | 'USD' | 'EUR'
// BILL-002: Invoice Status Lifecycle
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue'
// BILL-004/005: Vendor Payment Records
export type VendorPaymentStatus = 'pending' | 'paid'
export type VendorRateType = 'per_video_minute' | 'per_project' | 'monthly'
export type BillingCurrency = 'ILS' | 'USD' | 'EUR'

export interface Project {
  id: string
  name: string
  client: string
  clientId: string
  clientContact?: string
  status: ProjectStatus
  priority: ProjectPriority
  startDate: string
  deadline: string
  budget: number
  spent: number
  currency?: BillingCurrency
  progress: number
  pm: string
  pmId: string
  services: string[]
  languages: LanguagePair[]
  taskCount: number
  completedTasks: number
  sourceFiles?: ProjectFile[]
  referenceFiles?: ProjectFile[]
  deliveredFiles?: ProjectFile[]
  notes?: ProjectNote[]
  quoteId?: string
  isArchived?: boolean
  videoVolume?: number // Billable volume in minutes
}

export interface LanguagePair {
  source: string
  target: string
  service: string
}

export interface ProjectFile {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  uploadedBy: string
  url: string
  isLocked?: boolean
}

export interface ProjectNote {
  id: string
  content: string
  visibility: NoteVisibility
  authorId: string
  authorName: string
  authorRole: UserRole
  createdAt: string
}

export interface Task {
  id: string
  projectId: string
  projectName: string
  name: string
  service: string
  serviceType: string // workflow step name (e.g., Transcription, Timing, Translation, QC)
  status: TaskStatus
  assignedVendor?: string
  vendorId?: string
  dueDate: string
  price: number
  sourceLanguage?: string
  targetLanguage?: string
  editorUrl?: string
  notes?: TaskNote[]
  sourceFiles?: ProjectFile[]
  deliveredFiles?: ProjectFile[]
  isDeleted?: boolean
  deletedAt?: string
  deletedBy?: string
}

export interface TaskNote {
  id: string
  content: string
  authorId: string
  authorName: string
  authorRole: UserRole
  isBlocker: boolean
  createdAt: string
}

// Update 01: Quote interface with name (required), optional project linkage
export interface Quote {
  id: string
  quoteNumber: string // Q-YYYY-NNN format
  // Update 01: name is the primary identifier (required), projectId is optional
  name: string // Required - human-readable label for the quote/request
  description?: string // Optional - longer context for the quote/request
  projectId?: string // Optional - can be linked later or never
  projectName?: string // Optional - only if projectId is set
  clientId: string
  clientName: string
  status: QuoteStatus
  // Update 01: services and languages are optional arrays
  services?: string[] // Optional - from SERVICES_LIST
  sourceLanguage?: string // Optional
  targetLanguages?: string[] // Optional
  // Update 01: price replaces totalAmount, currency is per-quote
  currency?: QuoteCurrency // Required only if price is entered
  price?: number // Optional - replaces totalAmount
  createdAt: string
  sentAt?: string
  approvedAt?: string
  approvedBy?: string
  signatureData?: string
  signerIp?: string
  rejectedAt?: string
  rejectionReason?: string
  notesToClient?: string
  internalNotes?: string
  items?: QuoteItem[] // Optional - line items
  pmId: string
  pmName: string
  version?: number
  // BILL-008: Repair quote fields
  isRepair?: boolean
  linkedProjectId?: string // Original project for repair
  chargeDecision?: 'pending' | 'charge_client' | 'absorb_cost'
  chargeDecisionBy?: string
  chargeDecisionAt?: string
  chargeDecisionEscalatedAt?: string // 48h escalation timestamp
  isDeleted?: boolean
  deletedAt?: string
}

export interface QuoteItem {
  id: string
  service: string
  description: string
  quantity: number
  unitRate: number
  lineTotal: number
  isRateOverridden?: boolean
}

// BILL-001/002/003: Invoice (read-only from iCount or manual upload)
export interface Invoice {
  id: string
  invoiceNumber: string
  projectId: string
  projectName: string
  clientId: string
  clientName: string
  status: InvoiceStatus
  currency: BillingCurrency
  amount: number
  dueDate: string
  issuedDate: string
  sentAt?: string
  viewedAt?: string
  paidAt?: string
  pdfUrl?: string
  pdfFileName?: string
  // iCount sync
  iCountId?: string
  syncedAt?: string
  syncError?: string
  // Manual upload fallback
  isManualUpload?: boolean
  uploadedBy?: string
  uploadedAt?: string
}

// BILL-004/005: Vendor Payment Records
export interface VendorPayment {
  id: string
  vendorId: string
  vendorName: string
  taskId?: string
  taskName?: string
  projectId?: string
  projectName?: string
  rateType: VendorRateType
  videoMinutes?: number // for per_video_minute rate
  rate: number
  amount: number
  currency: BillingCurrency
  status: VendorPaymentStatus
  period?: string // YYYY-MM for monthly payments
  createdAt: string
  paidAt?: string
  mekanoSyncError?: string // flag if Mekano failed
}

// CLIENT-001: Client Profile
export type ClientStatus = 'active' | 'archived'
export type ClientRole = 'client_admin' | 'task_owner' | 'reviewer' | 'viewer'
export type PaymentTerms = 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt'

export interface ClientContact {
  id: string
  name: string
  email: string
  phone?: string
  role?: string // role/department at the client company
  isPrimary: boolean
}

export interface ClientRateCard {
  serviceType: string
  rate: number
  currency: BillingCurrency
}

export interface Client {
  id: string
  // Company Details
  legalName: string
  displayName: string
  companyId?: string // VAT / Company ID
  timezone: string
  // Contacts
  contacts: ClientContact[]
  // Billing Info
  billingAddress?: string
  paymentTerms: PaymentTerms
  defaultCurrency: BillingCurrency
  taxDetails?: string
  // Communication Preferences
  preferredChannel: 'email' | 'phone'
  notificationRecipients?: string[] // email addresses
  // Rate Card
  rateCard: ClientRateCard[]
  // Internal Notes (visible only to Admin/PM)
  internalNotes?: string
  // Status
  status: ClientStatus
  // Linked Data (counts for display)
  activeProjectCount: number
  // Timestamps
  createdAt: string
  archivedAt?: string
}

// CLIENT-002: Client User (team member)
export interface ClientUser {
  id: string
  clientId: string
  name: string
  email: string
  phone?: string
  clientRole: ClientRole
  status: 'active' | 'pending_setup' | 'inactive'
  invitedAt: string
  activatedAt?: string
  deactivatedAt?: string
}

// VENDOR-001: Vendor Profile (all vendors are individual persons)
export type VendorStatus = 'active' | 'archived'
export type VendorAvailability = 'available' | 'limited' | 'unavailable'
export type VendorRateUnit = 'per_minute' | 'per_subtitle' | 'per_file' | 'fixed_fee'
export type VendorPaymentMethod = 'payoneer' | 'bank_transfer'

export interface VendorLanguagePair {
  source: string
  target: string
}

export interface VendorRateCardLine {
  id: string
  serviceType: string
  languagePair: VendorLanguagePair
  rate: number
  unit: VendorRateUnit
  currency: BillingCurrency
  minimum?: number
  rushMultiplier?: number
  // Rate change approval (VENDOR-005)
  pendingRate?: number
  pendingStatus?: 'pending' | 'approved' | 'rejected'
  pendingProposedBy?: string
  pendingProposedAt?: string
}

export interface VendorBlackoutPeriod {
  startDate: string
  endDate: string
  notes?: string
}

export interface Vendor {
  id: string
  // Contact & Identity
  name: string
  email: string
  phone?: string
  whatsapp?: string
  timezone: string
  location?: string
  legalTaxDetails?: string
  paymentMethod?: VendorPaymentMethod
  paymentDetails?: string // account details
  // Skills / Services
  serviceTypes: string[] // Transcription / Translation / QA / Review
  languagePairs: VendorLanguagePair[]
  // Rate Card (vendor pay rates)
  rateCard: VendorRateCardLine[]
  // Availability (VENDOR-002)
  availability: VendorAvailability
  blackoutPeriods?: VendorBlackoutPeriod[]
  // Performance (VENDOR-003)
  tasksDelivered: number
  onTimeRate: number // percentage 0-100
  avgTurnaroundDays: number
  // TASK-003: Current workload for assignment modal
  activeTasks?: number
  // Status
  status: VendorStatus
  // Linked user account
  linkedUserId?: string
  profileCompleted: boolean
  // Timestamps
  createdAt: string
  archivedAt?: string
  // Internal notes (Admin/PM only)
  internalNotes?: string
}

// NOTIF-001: In-App Notification Types
export type NotificationType =
  | 'task_assigned'
  | 'task_submitted'
  | 'task_overdue'
  | 'task_rework'
  | 'task_complete'
  | 'blocker_flagged'
  | 'task_offer'
  | 'vendor_accepted_offer'
  | 'client_message'
  | 'quote_sent'
  | 'quote_approved'
  | 'quote_rejected'
  | 'quote_changes_requested'
  | 'invoice_sent'
  | 'invoice_overdue'
  | 'invoice_paid'
  | 'payment_processed'
  | 'project_delivered'
  | 'account_invite'
  | 'password_reset'
  | 'role_changed'
  | 'services_catalog_updated'
  | 'system_alert'
  | 'tasks_overdue_digest' // NOTIF-004: Daily digest for tasks overdue >24h
  | 'invoices_overdue_digest' // NOTIF-004: Weekly digest for invoices overdue >30d

export type NotificationCategory = 'tasks' | 'projects' | 'billing' | 'system' | 'account'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  category: NotificationCategory
  title: string
  preview?: string
  entityType?: 'task' | 'project' | 'invoice' | 'quote' | 'vendor' | 'user'
  entityId?: string
  entityUrl?: string
  isRead: boolean
  createdAt: string
}

// NOTIF-003: Notification Preferences
export interface NotificationPreference {
  type: NotificationType
  category: NotificationCategory
  label: string
  inApp: boolean
  email: boolean
  isAlwaysOn?: boolean // for critical security notifications
}

// SERV-001: Services Catalog
export type ServiceCategory = 'transcription' | 'translation' | 'editing_qc' | 'technical' | 'billing_only'
export type ServicePricingModel = 'per_minute' | 'per_subtitle' | 'per_file' | 'custom'
export type WorkflowStepType = 'transcription' | 'timing' | 'translation' | 'qc' | 'qc2' | 'pm_verification' | 'client_review' | 'upload' | 'other'

export interface WorkflowStep {
  id: string
  name: string
  type: WorkflowStepType
  description?: string
  isHumanOnly?: boolean // QC/QC2 are always human-only
  order: number
}

export interface Service {
  id: string
  name: string
  category: ServiceCategory
  pricingModel: ServicePricingModel
  defaultBaseRate: number
  rateCurrency: BillingCurrency
  rateNotes?: string
  workflow: WorkflowStep[]
  isArchived?: boolean
  createdAt: string
  updatedAt: string
}

// SERV-002: Translation Rate Card (Language Pair Pricing)
export interface TranslationRateCardEntry {
  id: string
  sourceLanguage: string
  targetLanguage: string
  rate: number
  rateUnit: ServicePricingModel
  currency: BillingCurrency
  effectiveDate?: string
  notes?: string
}

// SERV-002: Per-Minute Video Rates (default rates)
export interface VideoMinuteRate {
  id: string
  currency: BillingCurrency
  defaultRate: number
  tiers?: { minMinutes: number; maxMinutes: number; rate: number }[]
  updatedAt: string
}

export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalRevenue: number
  pendingPayments: number
  overdueInvoices: number
  activeVendors: number
  pendingTasks: number
}

// BILL-008: Internal Cost Record (absorbed repairs)
export interface InternalCost {
  id: string
  quoteId: string
  quoteRef: string
  projectId: string
  projectName: string
  serviceType: string
  amount: number
  currency: BillingCurrency
  reason: string // e.g. "Repair — Absorbed"
  dateAbsorbed: string
  absorbedBy: string
  absorbedByName: string
}

// BILL-009: Billing Audit Trail
export type BillingAuditAction =
  | 'quote_created'
  | 'quote_edited'
  | 'quote_sent'
  | 'quote_approved'
  | 'quote_rejected'
  | 'quote_expired'
  | 'invoice_synced'
  | 'invoice_uploaded'
  | 'invoice_sent'
  | 'invoice_viewed'
  | 'invoice_marked_paid'
  | 'invoice_voided'
  | 'vendor_payment_created'
  | 'vendor_payment_marked_paid'
  | 'repair_quote_created'
  | 'repair_charge_decision'

export interface BillingAuditEntry {
  id: string
  timestamp: string
  actorId: string
  actorName: string
  actorRole: UserRole
  action: BillingAuditAction
  targetType: 'quote' | 'invoice' | 'vendor_payment' | 'internal_cost'
  targetId: string
  targetRef: string // e.g. invoice number, quote number
  details: string // e.g. "Status changed from Draft to Sent"
}
