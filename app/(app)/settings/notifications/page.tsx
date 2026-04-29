'use client'

import { useState } from 'react'
import { Bell, Mail, Lock, Check, Shield, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '../../layout'
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/mock-data'
import type { NotificationPreference } from '@/lib/types'

const categoryLabels: Record<string, string> = {
  tasks: 'Task Notifications',
  projects: 'Project Notifications',
  billing: 'Billing Notifications',
  system: 'System Notifications',
  account: 'Account Notifications',
}

const categoryOrder = ['tasks', 'projects', 'billing', 'system', 'account']

// Role-based visibility for preferences
const roleVisibility: Record<string, string[] | undefined> = {
  task_submitted: ['admin', 'pm'],
  task_offer: ['vendor'],
  blocker_flagged: ['admin', 'pm'],
  client_message: ['admin', 'pm'],
  quote_sent: ['client'],
  quote_approved: ['admin', 'pm', 'finance'],
  quote_rejected: ['admin', 'pm', 'finance'],
  quote_changes_requested: ['admin', 'pm', 'finance'],
  invoice_sent: ['client'],
  payment_processed: ['vendor'],
  services_catalog_updated: ['admin', 'pm', 'it'],
  system_alert: ['admin', 'pm', 'it'],
}

export default function NotificationPreferencesPage() {
  const { currentRole } = useRole()
  const { toast } = useToast()
  const isAdmin = currentRole === 'admin'
  
  const [preferences, setPreferences] = useState<NotificationPreference[]>(
    DEFAULT_NOTIFICATION_PREFERENCES
  )
  const [systemDefaults, setSystemDefaults] = useState<NotificationPreference[]>(
    DEFAULT_NOTIFICATION_PREFERENCES
  )
  const [recentlySaved, setRecentlySaved] = useState<string | null>(null)
  const [recentlySavedDefault, setRecentlySavedDefault] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'personal' | 'system'>('personal')

  // Filter preferences based on role visibility
  const visiblePreferences = preferences.filter(pref => {
    const visibility = roleVisibility[pref.type]
    if (!visibility) return true
    return visibility.includes(currentRole)
  })

  // Group by category in order
  const groupedPreferences: Record<string, NotificationPreference[]> = {}
  categoryOrder.forEach(cat => {
    const prefs = visiblePreferences.filter(p => p.category === cat)
    if (prefs.length > 0) {
      groupedPreferences[cat] = prefs
    }
  })

  const handleToggle = async (prefType: string, channel: 'inApp' | 'email', value: boolean) => {
    // Find the preference
    const pref = preferences.find(p => p.type === prefType)
    if (!pref || pref.isAlwaysOn) return // Can't toggle always-on prefs

    // Update state optimistically
    setPreferences(preferences.map(p => 
      p.type === prefType ? { ...p, [channel]: value } : p
    ))

    // Auto-save with subtle feedback
    setRecentlySaved(prefType)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Show brief "Saved" indicator then clear
    setTimeout(() => setRecentlySaved(null), 1500)
  }

  const handleResetToDefaults = () => {
    setPreferences(DEFAULT_NOTIFICATION_PREFERENCES)
    toast({
      title: 'Preferences reset',
      description: 'Notification preferences have been reset to system defaults.',
    })
  }

  // SET-007: Admin system-wide defaults toggle handler
  const handleToggleSystemDefault = async (prefType: string, channel: 'inApp' | 'email', value: boolean) => {
    const pref = systemDefaults.find(p => p.type === prefType)
    if (!pref || pref.isAlwaysOn) return

    setSystemDefaults(systemDefaults.map(p => 
      p.type === prefType ? { ...p, [channel]: value } : p
    ))

    setRecentlySavedDefault(prefType)
    await new Promise(resolve => setTimeout(resolve, 300))
    setTimeout(() => setRecentlySavedDefault(null), 1500)
  }

  const handleResetSystemDefaults = () => {
    setSystemDefaults(DEFAULT_NOTIFICATION_PREFERENCES)
    toast({
      title: 'System defaults reset',
      description: 'System-wide notification defaults have been reset.',
    })
  }

  return (
    <TooltipProvider>
      <div className="p-6 max-w-4xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Notification Preferences</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure how you receive notifications. Changes are saved automatically.
          </p>
        </div>

        {/* Admin: Show tabs for personal vs system-wide defaults */}
        {isAdmin ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'personal' | 'system')} className="space-y-6">
            <TabsList>
              <TabsTrigger value="personal" className="gap-1.5">
                <Bell className="h-4 w-4" />
                My Preferences
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-1.5">
                <Settings className="h-4 w-4" />
                System Defaults
              </TabsTrigger>
            </TabsList>

            {/* Personal Preferences Tab */}
            <TabsContent value="personal" className="space-y-6">
              {/* Info Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Channel Options</p>
                      <p className="text-muted-foreground">
                        <strong>In-app:</strong> Notifications appear in the Notification Center.
                        <br />
                        <strong>Email:</strong> Notifications are sent to your registered email address.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

          {/* Preferences by Category */}
          {Object.entries(groupedPreferences).map(([category, prefs]) => (
            <Card key={category}>
              <CardHeader className="pb-0">
                <CardTitle className="text-base">{categoryLabels[category]}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50%]">Notification</TableHead>
                      <TableHead className="text-center w-[25%]">
                        <div className="flex items-center justify-center gap-1">
                          <Bell className="h-4 w-4" />
                          In-app
                        </div>
                      </TableHead>
                      <TableHead className="text-center w-[25%]">
                        <div className="flex items-center justify-center gap-1">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prefs.map((pref) => (
                      <TableRow key={pref.type}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium text-sm">{pref.label}</p>
                            </div>
                            {pref.isAlwaysOn && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Critical security notification - always enabled</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {recentlySaved === pref.type && (
                              <span className="flex items-center gap-1 text-xs text-green-600 animate-in fade-in">
                                <Check className="h-3 w-3" />
                                Saved
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {pref.isAlwaysOn ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-muted-foreground">Always on</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>This notification cannot be disabled</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Switch
                              checked={pref.inApp}
                              onCheckedChange={(checked) => handleToggle(pref.type, 'inApp', checked)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {pref.isAlwaysOn ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-muted-foreground">Always on</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>This notification cannot be disabled</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Switch
                              checked={pref.email}
                              onCheckedChange={(checked) => handleToggle(pref.type, 'email', checked)}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}

          {/* Reset to Defaults */}
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleResetToDefaults}>
                  Reset to Defaults
                </Button>
              </div>
            </TabsContent>

            {/* System-Wide Defaults Tab (Admin Only) */}
            <TabsContent value="system" className="space-y-6">
              {/* Info Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">System-Wide Notification Defaults</p>
                      <p className="text-muted-foreground">
                        Configure the default notification settings for all new users.
                        Existing users can override these in their personal preferences.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Default Preferences by Category */}
              {Object.entries(groupedPreferences).map(([category, prefs]) => (
                <Card key={`system-${category}`}>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-base">{categoryLabels[category]}</CardTitle>
                    <CardDescription>Default settings for new users</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 py-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50%]">Notification</TableHead>
                          <TableHead className="text-center w-[25%]">
                            <div className="flex items-center justify-center gap-1">
                              <Bell className="h-4 w-4" />
                              In-app
                            </div>
                          </TableHead>
                          <TableHead className="text-center w-[25%]">
                            <div className="flex items-center justify-center gap-1">
                              <Mail className="h-4 w-4" />
                              Email
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prefs.map((pref) => {
                          const sysPref = systemDefaults.find(p => p.type === pref.type) || pref
                          return (
                            <TableRow key={`system-${pref.type}`}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div>
                                    <p className="font-medium text-sm">{pref.label}</p>
                                  </div>
                                  {pref.isAlwaysOn && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Critical security notification - always enabled</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {recentlySavedDefault === pref.type && (
                                    <span className="flex items-center gap-1 text-xs text-green-600 animate-in fade-in">
                                      <Check className="h-3 w-3" />
                                      Saved
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {pref.isAlwaysOn ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-xs text-muted-foreground">Always on</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>This notification cannot be disabled</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Switch
                                    checked={sysPref.inApp}
                                    onCheckedChange={(checked) => handleToggleSystemDefault(pref.type, 'inApp', checked)}
                                  />
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {pref.isAlwaysOn ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-xs text-muted-foreground">Always on</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>This notification cannot be disabled</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Switch
                                    checked={sysPref.email}
                                    onCheckedChange={(checked) => handleToggleSystemDefault(pref.type, 'email', checked)}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}

              {/* Reset System Defaults */}
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleResetSystemDefaults}>
                  Reset System Defaults
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // Non-admin view: Personal preferences only
          <div className="space-y-6">
            {/* Info Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Channel Options</p>
                    <p className="text-muted-foreground">
                      <strong>In-app:</strong> Notifications appear in the Notification Center.
                      <br />
                      <strong>Email:</strong> Notifications are sent to your registered email address.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferences by Category */}
            {Object.entries(groupedPreferences).map(([category, prefs]) => (
              <Card key={category}>
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">{categoryLabels[category]}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50%]">Notification</TableHead>
                        <TableHead className="text-center w-[25%]">
                          <div className="flex items-center justify-center gap-1">
                            <Bell className="h-4 w-4" />
                            In-app
                          </div>
                        </TableHead>
                        <TableHead className="text-center w-[25%]">
                          <div className="flex items-center justify-center gap-1">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prefs.map((pref) => (
                        <TableRow key={pref.type}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium text-sm">{pref.label}</p>
                              </div>
                              {pref.isAlwaysOn && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Critical security notification - always enabled</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {recentlySaved === pref.type && (
                                <span className="flex items-center gap-1 text-xs text-green-600 animate-in fade-in">
                                  <Check className="h-3 w-3" />
                                  Saved
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {pref.isAlwaysOn ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-muted-foreground">Always on</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This notification cannot be disabled</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Switch
                                checked={pref.inApp}
                                onCheckedChange={(checked) => handleToggle(pref.type, 'inApp', checked)}
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {pref.isAlwaysOn ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-muted-foreground">Always on</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This notification cannot be disabled</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Switch
                                checked={pref.email}
                                onCheckedChange={(checked) => handleToggle(pref.type, 'email', checked)}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}

            {/* Reset to Defaults */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleResetToDefaults}>
                Reset to Defaults
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
