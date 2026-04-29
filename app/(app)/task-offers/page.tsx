'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Languages,
  Check,
  ShieldAlert,
} from 'lucide-react'
import { useRole } from '../layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate, TASK_SERVICE_TYPES } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

// Mock task offers (tasks with status 'open_for_offers')
const taskOffers = [
  {
    id: 'to1',
    name: 'Pilot - Voice Recording',
    project: 'Disney+ Series Adaptation',
    projectId: 'p2',
    deadline: '2024-02-20',
    service: 'Dubbing with AI Transcript',
    serviceType: 'QC',
    sourceLanguage: 'EN',
    targetLanguage: 'ES',
    duration: '45 min',
    pmDescription: 'High priority task. Please ensure quality voice sync with the original.',
  },
  {
    id: 'to2',
    name: 'Episode 3 - Subtitling PT',
    project: 'Netflix Q1 Localization',
    projectId: 'p1',
    deadline: '2024-02-25',
    service: 'Subtitles Transcription AI',
    serviceType: 'Translation',
    sourceLanguage: 'EN',
    targetLanguage: 'PT',
    duration: '52 min',
    pmDescription: '',
  },
  {
    id: 'to3',
    name: 'Documentary - Timing',
    project: 'HBO Max Documentary',
    projectId: 'p3',
    deadline: '2024-02-18',
    service: 'Subtitles Transcription AI',
    serviceType: 'Timing',
    sourceLanguage: 'EN',
    targetLanguage: 'ES',
    duration: '90 min',
    pmDescription: 'Please follow Netflix timing guidelines for this project.',
  },
]

function getDaysUntilDeadline(dateString: string): { days: number; isUrgent: boolean; label: string } {
  const deadline = new Date(dateString)
  const today = new Date()
  const diffTime = deadline.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 0) {
    return { days: 0, isUrgent: true, label: 'Due today' }
  } else if (diffDays <= 2) {
    return { days: diffDays, isUrgent: true, label: `Deadline in ${diffDays} day${diffDays !== 1 ? 's' : ''}` }
  } else {
    return { days: diffDays, isUrgent: false, label: `Deadline in ${diffDays} days` }
  }
}

function getServiceIcon(serviceType: string): string {
  const icons: Record<string, string> = {
    'Transcription': '🎙️',
    'Timing': '⏱️',
    'Translation': '🌐',
    'QC': '✅',
    'PM Verification': '📋',
    'Client Review': '👤',
  }
  return icons[serviceType] || '📄'
}

export default function TaskOffersPage() {
  const { currentRole } = useRole()
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [acceptedOffers, setAcceptedOffers] = useState<string[]>([])
  const [confirmOffer, setConfirmOffer] = useState<typeof taskOffers[0] | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Only vendors can access task offers
  if (currentRole !== 'vendor') {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 p-6">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground">Task offers are only available to vendors.</p>
      </div>
    )
  }

  const filteredOffers = taskOffers.filter((offer) => {
    if (acceptedOffers.includes(offer.id)) return false
    const matchesService = serviceFilter === 'all' || offer.serviceType === serviceFilter
    const matchesSearch =
      offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.project.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesService && matchesSearch
  })

  const handleAcceptClick = (offer: typeof taskOffers[0]) => {
    setConfirmOffer(offer)
  }

  const handleConfirmAccept = async () => {
    if (!confirmOffer) return
    
    setIsAccepting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    
    setAcceptedOffers([...acceptedOffers, confirmOffer.id])
    setIsAccepting(false)
    setConfirmOffer(null)
    setShowSuccess(true)
    
    // Hide success animation after 2 seconds
    setTimeout(() => setShowSuccess(false), 2000)
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Success Animation Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center animate-in zoom-in-50 fade-in duration-300">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-semibold">Task Accepted!</h2>
            <p className="text-muted-foreground mt-1">You&apos;re now assigned to this task.</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Task Offers</h1>
        <p className="text-sm text-muted-foreground">
          {filteredOffers.length} open offer{filteredOffers.length !== 1 ? 's' : ''} matching your skills
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search offers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-72 rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Task Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Task Types</SelectItem>
            {TASK_SERVICE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {getServiceIcon(type)} {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Offers List */}
      <div className="space-y-4">
        {filteredOffers.map((offer) => {
          const deadlineInfo = getDaysUntilDeadline(offer.deadline)
          
          return (
            <Card key={offer.id} className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getServiceIcon(offer.serviceType)}</span>
                      <h3 className="text-lg font-semibold text-foreground">{offer.name}</h3>
                    </div>
                    <Link
                      href={`/projects/${offer.projectId}`}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {offer.project}
                    </Link>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Languages className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {offer.sourceLanguage} → {offer.targetLanguage}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{offer.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className={cn(deadlineInfo.isUrgent && "text-orange-600 font-medium")}>
                          {formatDate(offer.deadline)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          deadlineInfo.isUrgent 
                            ? "bg-orange-100 text-orange-700" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {deadlineInfo.label}
                        </span>
                      </div>
                    </div>

                    {offer.pmDescription && (
                      <div className="mt-3 rounded-lg bg-white/60 border border-orange-100 p-3">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">PM Instructions: </span>
                          {offer.pmDescription}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <Button onClick={() => handleAcceptClick(offer)} className="gap-1.5 min-w-[120px]">
                      <Check className="h-4 w-4" />
                      Accept
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredOffers.length === 0 && (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
            <div className="text-center">
              <p className="text-lg font-medium text-muted-foreground">No open task offers</p>
              <p className="text-sm text-muted-foreground mt-1">
                {acceptedOffers.length > 0
                  ? "No open task offers matching your skills right now. We'll notify you when new ones are posted."
                  : "No open task offers matching your skills right now. We'll notify you when new ones are posted."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmOffer} onOpenChange={(open) => !open && setConfirmOffer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Task</DialogTitle>
            <DialogDescription>
              Accept this task? It will be assigned to you immediately.
            </DialogDescription>
          </DialogHeader>
          {confirmOffer && (
            <div className="py-4">
              <div className="rounded-lg border border-border p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <span>{getServiceIcon(confirmOffer.serviceType)}</span>
                  <h4 className="font-medium">{confirmOffer.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{confirmOffer.project}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span>{confirmOffer.sourceLanguage} → {confirmOffer.targetLanguage}</span>
                  <span>Due: {formatDate(confirmOffer.deadline)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOffer(null)} disabled={isAccepting}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAccept} disabled={isAccepting}>
              {isAccepting ? 'Accepting...' : 'Accept Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
