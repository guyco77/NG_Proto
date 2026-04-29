import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * EDIT-002: Editor → GUNO Studio Status Sync Webhook
 * EDIT-003: Editor Deliverables Sync Webhook
 * 
 * This endpoint receives webhook calls from the Editor system for:
 * 1. Task status updates (vendor starts work, submits deliverable)
 * 2. Deliverable file references (completed files to be synced)
 * 
 * Security:
 * - Validates webhook signature (HMAC-SHA256 with shared secret)
 * - Verifies vendor ID matches assigned vendor
 * - Rejects webhooks for reassigned tasks
 */

// Status mapping: Editor → GUNO Studio (configurable per PRD)
const STATUS_MAP: Record<string, string> = {
  'started': 'in_progress',
  'in_progress': 'in_progress',
  'submitted': 'submitted',
  'done': 'submitted',
  'completed': 'submitted',
}

interface EditorWebhookPayload {
  type: 'status_update' | 'deliverable_sync'
  taskId: string
  vendorId: string
  timestamp: string
  // For status updates
  status?: string
  // For deliverables
  deliverable?: {
    fileId: string
    fileName: string
    fileSize: number
    fileFormat: string
    downloadUrl: string
  }
}

/**
 * Validates webhook signature using HMAC-SHA256
 * Signature is expected in 'x-editor-signature' header
 */
function validateSignature(payload: string, signature: string): boolean {
  const secret = process.env.EDITOR_WEBHOOK_SECRET || 'dev-secret-key'
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Verifies the vendor ID in the webhook matches the currently assigned vendor
 * Rejects webhooks for reassigned tasks (TASK-007)
 */
async function verifyVendorAssignment(taskId: string, vendorId: string): Promise<boolean> {
  // In production, this would query the database
  // For now, return true for mock purposes
  // TODO: Implement actual database check
  return true
}

/**
 * Updates task status in the database
 */
async function updateTaskStatus(taskId: string, newStatus: string): Promise<void> {
  // In production, this would update the database
  // TODO: Implement actual database update
  console.log(`[Editor Webhook] Task ${taskId} status updated to ${newStatus}`)
}

/**
 * Downloads deliverable from Editor and stores in Supabase Storage
 * Returns the new storage URL
 */
async function syncDeliverable(
  taskId: string,
  deliverable: EditorWebhookPayload['deliverable']
): Promise<string> {
  if (!deliverable) throw new Error('Deliverable data missing')
  
  // In production, this would:
  // 1. Download file from Editor's downloadUrl
  // 2. Upload to Supabase Storage
  // 3. Create database record for the deliverable
  // 4. Hide previous deliverable version if exists (but retain in storage)
  // 5. Return signed URL (30-day expiry)
  
  console.log(`[Editor Webhook] Syncing deliverable ${deliverable.fileName} for task ${taskId}`)
  
  // TODO: Implement actual file sync
  return `https://storage.supabase.co/v1/object/sign/deliverables/${taskId}/${deliverable.fileName}`
}

/**
 * Triggers notification to PM/IT when Editor is unreachable
 * (Called from polling fallback - NOTIF-004)
 */
async function alertEditorUnreachable(): Promise<void> {
  // TODO: Implement NOTIF-004 notification
  console.log('[Editor Webhook] Alert: Editor unreachable - notifying PM/IT')
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-editor-signature')
    
    // Validate signature
    if (!signature || !validateSignature(rawBody, signature)) {
      console.error('[Editor Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    const payload: EditorWebhookPayload = JSON.parse(rawBody)
    
    // Verify vendor assignment (reject if reassigned)
    const isValidVendor = await verifyVendorAssignment(payload.taskId, payload.vendorId)
    if (!isValidVendor) {
      console.error(`[Editor Webhook] Vendor ${payload.vendorId} not assigned to task ${payload.taskId}`)
      return NextResponse.json(
        { error: 'Vendor not assigned to this task' },
        { status: 403 }
      )
    }
    
    // Handle different webhook types
    switch (payload.type) {
      case 'status_update': {
        if (!payload.status) {
          return NextResponse.json(
            { error: 'Missing status in payload' },
            { status: 400 }
          )
        }
        
        const gunoStatus = STATUS_MAP[payload.status.toLowerCase()]
        if (!gunoStatus) {
          console.warn(`[Editor Webhook] Unknown Editor status: ${payload.status}`)
          return NextResponse.json(
            { error: `Unknown status: ${payload.status}` },
            { status: 400 }
          )
        }
        
        await updateTaskStatus(payload.taskId, gunoStatus)
        
        return NextResponse.json({
          success: true,
          message: `Task ${payload.taskId} status updated to ${gunoStatus}`,
        })
      }
      
      case 'deliverable_sync': {
        if (!payload.deliverable) {
          return NextResponse.json(
            { error: 'Missing deliverable in payload' },
            { status: 400 }
          )
        }
        
        const storageUrl = await syncDeliverable(payload.taskId, payload.deliverable)
        
        return NextResponse.json({
          success: true,
          message: 'Deliverable synced successfully',
          storageUrl,
        })
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown webhook type: ${payload.type}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[Editor Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for health check / polling fallback status
 * Returns the current Editor integration status
 */
export async function GET() {
  // In production, this would check Editor API health
  // and return last sync timestamp
  return NextResponse.json({
    status: 'ok',
    editorReachable: true,
    lastSync: new Date().toISOString(),
    retryCount: 0,
  })
}
