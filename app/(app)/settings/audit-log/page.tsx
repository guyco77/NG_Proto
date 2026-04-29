'use client'

import { useState, useMemo } from 'react'
import { Search, Clock, Shield, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useRole } from '../../layout'
import { cn } from '@/lib/utils'

// SET-001: Settings Audit Log
interface SettingsAuditEntry {
  id: string
  timestamp: string
  actorId: string
  actorName: string
  actorRole: string
  settingsArea: 'company' | 'billing' | 'editor' | 'email_templates' | 'services' | 'notifications'
  action: string
  field?: string
  oldValue?: string
  newValue?: string
}

const SETTINGS_AREAS = [
  { value: 'all', label: 'All Areas' },
  { value: 'company', label: 'Company Settings' },
  { value: 'billing', label: 'Billing Settings' },
  { value: 'editor', label: 'Editor Integration' },
  { value: 'email_templates', label: 'Email Templates' },
  { value: 'services', label: 'Services Catalog' },
  { value: 'notifications', label: 'Notification Preferences' },
]

const mockSettingsAuditLog: SettingsAuditEntry[] = [
  {
    id: 'sal1',
    timestamp: '2024-02-28T14:30:00Z',
    actorId: '1',
    actorName: 'Sarah Admin',
    actorRole: 'admin',
    settingsArea: 'company',
    action: 'Updated company settings',
    field: 'Default Currency',
    oldValue: 'USD',
    newValue: 'ILS',
  },
  {
    id: 'sal2',
    timestamp: '2024-02-28T12:15:00Z',
    actorId: '1',
    actorName: 'Sarah Admin',
    actorRole: 'admin',
    settingsArea: 'email_templates',
    action: 'Updated email template',
    field: 'Quote Sent - Subject',
    oldValue: 'New quote from NG Broadcast',
    newValue: 'New quote from {company_name}: {project_name}',
  },
  {
    id: 'sal3',
    timestamp: '2024-02-27T16:45:00Z',
    actorId: '5',
    actorName: 'Dan IT',
    actorRole: 'it',
    settingsArea: 'editor',
    action: 'Updated Editor API credentials',
  },
  {
    id: 'sal4',
    timestamp: '2024-02-27T11:30:00Z',
    actorId: '1',
    actorName: 'Sarah Admin',
    actorRole: 'admin',
    settingsArea: 'company',
    action: 'Uploaded company logo',
  },
  {
    id: 'sal5',
    timestamp: '2024-02-26T15:00:00Z',
    actorId: '4',
    actorName: 'Frank Finance',
    actorRole: 'finance',
    settingsArea: 'billing',
    action: 'Updated billing settings',
    field: 'Default Tax Rate',
    oldValue: '18%',
    newValue: '17%',
  },
  {
    id: 'sal6',
    timestamp: '2024-02-26T10:00:00Z',
    actorId: '1',
    actorName: 'Sarah Admin',
    actorRole: 'admin',
    settingsArea: 'services',
    action: 'Created new service',
    field: 'Service Name',
    newValue: 'AI Dubbing',
  },
  {
    id: 'sal7',
    timestamp: '2024-02-25T14:30:00Z',
    actorId: '2',
    actorName: 'Mike Manager',
    actorRole: 'pm',
    settingsArea: 'services',
    action: 'Updated service workflow',
    field: 'Subtitling - Steps',
    oldValue: '3 steps',
    newValue: '4 steps',
  },
  {
    id: 'sal8',
    timestamp: '2024-02-25T09:00:00Z',
    actorId: '1',
    actorName: 'Sarah Admin',
    actorRole: 'admin',
    settingsArea: 'notifications',
    action: 'Updated system notification defaults',
    field: 'Invoice Overdue - Email',
    oldValue: 'On',
    newValue: 'Off',
  },
]

const PAGE_SIZE = 20

export default function SettingsAuditLogPage() {
  const { currentRole } = useRole()
  const isAdmin = currentRole === 'admin'

  const [searchQuery, setSearchQuery] = useState('')
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter entries
  const filteredEntries = useMemo(() => {
    return mockSettingsAuditLog.filter((entry) => {
      const matchesArea = areaFilter === 'all' || entry.settingsArea === areaFilter
      const matchesSearch = searchQuery === '' ||
        entry.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.field?.toLowerCase().includes(searchQuery.toLowerCase())
      
      let matchesDate = true
      if (dateFrom || dateTo) {
        const entryDate = new Date(entry.timestamp)
        if (dateFrom && entryDate < new Date(dateFrom)) matchesDate = false
        if (dateTo && entryDate > new Date(dateTo + 'T23:59:59')) matchesDate = false
      }
      
      return matchesArea && matchesSearch && matchesDate
    })
  }, [areaFilter, searchQuery, dateFrom, dateTo])

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / PAGE_SIZE)
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredEntries.slice(start, start + PAGE_SIZE)
  }, [filteredEntries, currentPage])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC', // Prevent hydration mismatch
    })
  }

  const getAreaLabel = (area: string) => {
    return SETTINGS_AREAS.find(a => a.value === area)?.label || area
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      pm: 'bg-blue-100 text-blue-800',
      finance: 'bg-green-100 text-green-800',
      it: 'bg-purple-100 text-purple-800',
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  if (!isAdmin) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can view the settings audit log.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View history of all settings changes across the system
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by actor, action, or field..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Area Filter */}
            <Select value={areaFilter} onValueChange={(v) => { setAreaFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Settings Area" />
              </SelectTrigger>
              <SelectContent>
                {SETTINGS_AREAS.map((area) => (
                  <SelectItem key={area.value} value={area.value}>
                    {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Date Range
                  {(dateFrom || dateTo) && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">1</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="start">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">From</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1) }}
                        className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">To</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1) }}
                        className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                      />
                    </div>
                  </div>
                  {(dateFrom || dateTo) && (
                    <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1) }} className="w-full text-xs">
                      Clear dates
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Change History</CardTitle>
          <CardDescription>
            {filteredEntries.length} entries found
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[150px]">Actor</TableHead>
                <TableHead className="w-[140px]">Settings Area</TableHead>
                <TableHead>Action / Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No audit entries found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(entry.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{entry.actorName}</p>
                          <span className={cn('text-xs px-1.5 py-0.5 rounded', getRoleBadgeColor(entry.actorRole))}>
                            {entry.actorRole}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{getAreaLabel(entry.settingsArea)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{entry.action}</p>
                        {entry.field && (
                          <p className="text-xs text-muted-foreground">
                            Field: <span className="font-medium">{entry.field}</span>
                            {entry.oldValue && entry.newValue && (
                              <span>
                                {' '}({entry.oldValue} → {entry.newValue})
                              </span>
                            )}
                            {!entry.oldValue && entry.newValue && (
                              <span> (→ {entry.newValue})</span>
                            )}
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, filteredEntries.length)} of {filteredEntries.length} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
