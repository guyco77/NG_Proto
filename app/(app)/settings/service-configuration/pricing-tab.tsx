'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Trash2, Save, DollarSign, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  mockTranslationRateCard,
  mockVideoMinuteRates,
  PRICING_MODELS,
  formatCurrency,
} from '@/lib/mock-data'
import type { TranslationRateCardEntry, VideoMinuteRate, BillingCurrency, ServicePricingModel } from '@/lib/types'

const CURRENCIES: { value: BillingCurrency; label: string }[] = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'ILS', label: 'ILS' },
]

const LANGUAGES = [
  { value: 'EN', label: 'English' },
  { value: 'ES', label: 'Spanish' },
  { value: 'FR', label: 'French' },
  { value: 'DE', label: 'German' },
  { value: 'IT', label: 'Italian' },
  { value: 'PT', label: 'Portuguese' },
  { value: 'ZH', label: 'Chinese' },
  { value: 'JA', label: 'Japanese' },
  { value: 'KO', label: 'Korean' },
  { value: 'AR', label: 'Arabic' },
  { value: 'HE', label: 'Hebrew' },
  { value: 'RU', label: 'Russian' },
]

/**
 * Update-004: Pricing Sub-Tab
 * 
 * Manages pricing rates for video minutes and translation language pairs.
 * Part of the Service Configuration umbrella page.
 * 
 * Cross-linking: Supports highlighting a specific language pair row when
 * navigated from Services sub-tab via ?highlight=EN-ES query param
 */
export function PricingTab() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  
  // Cross-linking: Get highlighted row from URL (e.g., ?highlight=EN-ES)
  const highlightParam = searchParams.get('highlight')
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null)
  const highlightedRowRef = useRef<HTMLTableRowElement>(null)

  // Video Minute Rates state
  const [videoRates, setVideoRates] = useState<VideoMinuteRate[]>(mockVideoMinuteRates)
  const [editingVideoRate, setEditingVideoRate] = useState<VideoMinuteRate | null>(null)

  // Translation Rate Card state
  const [translationRates, setTranslationRates] = useState<TranslationRateCardEntry[]>(mockTranslationRateCard)
  const [addTranslationDialog, setAddTranslationDialog] = useState(false)
  
// Inner tab state (for cross-linking to translation tab)
  const [innerTab, setInnerTab] = useState<string>(highlightParam ? 'translation' : 'video')
  
  // Update-004: Handle cross-link highlighting and scroll to row
  useEffect(() => {
    if (highlightParam) {
      // Find the matching row (format: SOURCE-TARGET, e.g., EN-ES)
      const [source, target] = highlightParam.split('-')
      const matchingEntry = translationRates.find(
        (r) => r.sourceLanguage === source && r.targetLanguage === target
      )
      if (matchingEntry) {
        setHighlightedRowId(matchingEntry.id)
        setInnerTab('translation')
        // Clear highlight after 3 seconds
        const timer = setTimeout(() => setHighlightedRowId(null), 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [highlightParam, translationRates])
  
  // Scroll to highlighted row when it becomes visible
  useEffect(() => {
    if (highlightedRowId && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightedRowId])

  const handleSaveVideoRate = (rate: VideoMinuteRate) => {
    setVideoRates(videoRates.map((r) => (r.id === rate.id ? { ...rate, updatedAt: new Date().toISOString().split('T')[0] } : r)))
    setEditingVideoRate(null)
    toast({ 
      title: 'Services catalog updated', 
      description: 'Video rate saved. Notification sent to Admin, PM, and IT.' 
    })
  }

  const handleAddTranslationRate = () => {
    if (!newTranslationEntry.sourceLanguage || !newTranslationEntry.targetLanguage) {
      toast({ title: 'Validation Error', description: 'Source and target languages are required.', variant: 'destructive' })
      return
    }
    if (newTranslationEntry.sourceLanguage === newTranslationEntry.targetLanguage) {
      toast({ title: 'Validation Error', description: 'Source and target languages must be different.', variant: 'destructive' })
      return
    }
    // Check for duplicate
    const duplicate = translationRates.find(
      (r) =>
        r.sourceLanguage === newTranslationEntry.sourceLanguage &&
        r.targetLanguage === newTranslationEntry.targetLanguage &&
        r.rateUnit === newTranslationEntry.rateUnit &&
        r.currency === newTranslationEntry.currency
    )
    if (duplicate) {
      toast({ title: 'Validation Error', description: 'This language pair with the same unit and currency already exists.', variant: 'destructive' })
      return
    }

    const entry: TranslationRateCardEntry = {
      id: `trc-${Date.now()}`,
      sourceLanguage: newTranslationEntry.sourceLanguage!,
      targetLanguage: newTranslationEntry.targetLanguage!,
      rate: newTranslationEntry.rate || 0,
      rateUnit: newTranslationEntry.rateUnit as ServicePricingModel || 'per_minute',
      currency: newTranslationEntry.currency as BillingCurrency || 'USD',
      effectiveDate: new Date().toISOString().split('T')[0],
      notes: newTranslationEntry.notes,
    }

    setTranslationRates([...translationRates, entry])
    setAddTranslationDialog(false)
    setNewTranslationEntry({
      sourceLanguage: 'EN',
      targetLanguage: 'ES',
      rate: 10,
      rateUnit: 'per_minute',
      currency: 'USD',
    })
    toast({ 
      title: 'Services catalog updated', 
      description: 'Translation rate added. Notification sent to Admin, PM, and IT.' 
    })
  }

  const handleDeleteTranslationRate = (id: string) => {
    setTranslationRates(translationRates.filter((r) => r.id !== id))
    toast({ title: 'Rate removed', description: 'Translation rate card entry has been removed.' })
  }

  const handleUpdateTranslationRate = (id: string, updates: Partial<TranslationRateCardEntry>) => {
    setTranslationRates(
      translationRates.map((r) => (r.id === id ? { ...r, ...updates } : r))
    )
  }

  return (
    <div className="space-y-6">
      {/* Update-004: Inner tabs with controlled state for cross-linking */}
      <Tabs value={innerTab} onValueChange={setInnerTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="video">Video Minute Rates</TabsTrigger>
          <TabsTrigger value="translation">Translation Rate Card</TabsTrigger>
        </TabsList>

        {/* Video Minute Rates Tab */}
        <TabsContent value="video" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Per-Minute Video Rates</CardTitle>
              <CardDescription>
                Default rates used by services with &quot;Per minute of video&quot; pricing model.
                Optional tiers allow volume-based discounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-4 pt-2">
              <div className="space-y-6">
                {videoRates.map((rate) => (
                  <div key={rate.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">{rate.currency} Rates</h3>
                          <p className="text-sm text-muted-foreground">
                            Default: {formatCurrency(rate.defaultRate)}/min
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingVideoRate(rate)}
                      >
                        Edit
                      </Button>
                    </div>

                    {rate.tiers && rate.tiers.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Volume Tiers:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {rate.tiers.map((tier, idx) => (
                            <div key={idx} className="p-2 bg-muted rounded text-sm">
                              <p className="text-muted-foreground">
                                {tier.minMinutes}–{tier.maxMinutes === 999999 ? '∞' : tier.maxMinutes} min
                              </p>
                              <p className="font-medium">{formatCurrency(tier.rate)}/min</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-3">
                      Last updated: {rate.updatedAt}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Edit Video Rate Dialog */}
          <Dialog open={!!editingVideoRate} onOpenChange={() => setEditingVideoRate(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit {editingVideoRate?.currency} Video Rate</DialogTitle>
                <DialogDescription>
                  Update the default per-minute rate and optional volume tiers.
                </DialogDescription>
              </DialogHeader>
              {editingVideoRate && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="defaultRate">Default Rate (per minute)</Label>
                    <input
                      id="defaultRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingVideoRate.defaultRate}
                      onChange={(e) =>
                        setEditingVideoRate({
                          ...editingVideoRate,
                          defaultRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    />
                  </div>

                  {editingVideoRate.tiers && editingVideoRate.tiers.length > 0 && (
                    <div>
                      <Label>Volume Tiers</Label>
                      <div className="space-y-2 mt-2">
                        {editingVideoRate.tiers.map((tier, idx) => (
                          <div key={idx} className="grid grid-cols-3 gap-2">
                            <input
                              type="number"
                              min="0"
                              value={tier.minMinutes}
                              onChange={(e) => {
                                const newTiers = [...editingVideoRate.tiers!]
                                newTiers[idx] = { ...tier, minMinutes: parseInt(e.target.value) || 0 }
                                setEditingVideoRate({ ...editingVideoRate, tiers: newTiers })
                              }}
                              placeholder="Min"
                              className="h-8 rounded border border-input bg-background px-2 text-sm"
                            />
                            <input
                              type="number"
                              min="0"
                              value={tier.maxMinutes === 999999 ? '' : tier.maxMinutes}
                              onChange={(e) => {
                                const newTiers = [...editingVideoRate.tiers!]
                                newTiers[idx] = { ...tier, maxMinutes: parseInt(e.target.value) || 999999 }
                                setEditingVideoRate({ ...editingVideoRate, tiers: newTiers })
                              }}
                              placeholder="Max (∞)"
                              className="h-8 rounded border border-input bg-background px-2 text-sm"
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={tier.rate}
                              onChange={(e) => {
                                const newTiers = [...editingVideoRate.tiers!]
                                newTiers[idx] = { ...tier, rate: parseFloat(e.target.value) || 0 }
                                setEditingVideoRate({ ...editingVideoRate, tiers: newTiers })
                              }}
                              placeholder="Rate"
                              className="h-8 rounded border border-input bg-background px-2 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingVideoRate(null)}>
                  Cancel
                </Button>
                <Button onClick={() => editingVideoRate && handleSaveVideoRate(editingVideoRate)}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Translation Rate Card Tab */}
        <TabsContent value="translation" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Translation Rate Card</CardTitle>
                <CardDescription>
                  Define rates by language pair. These override the service&apos;s default base rate
                  when a project has matching source/target languages.
                </CardDescription>
              </div>
              <Button onClick={() => setAddTranslationDialog(true)} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Rate
              </Button>
            </CardHeader>
            <CardContent className="px-6 pb-4 pt-2">
              <Table>
                {/* Update-004: Added Effective Date column per SERV-002 spec */}
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                {/* Update-004: Table rows with cross-link highlighting support */}
                <TableBody>
                  {translationRates.map((entry) => {
                    const isHighlighted = highlightedRowId === entry.id
                    return (
                      <TableRow 
                        key={entry.id}
                        ref={isHighlighted ? highlightedRowRef : null}
                        className={isHighlighted ? 'bg-primary/10 animate-pulse' : ''}
                      >
                        <TableCell>
                          <span className="font-medium">{entry.sourceLanguage}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{entry.targetLanguage}</span>
                        </TableCell>
                        <TableCell>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={entry.rate}
                            onChange={(e) =>
                              handleUpdateTranslationRate(entry.id, {
                                rate: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="h-8 w-20 rounded border border-input bg-background px-2 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={entry.rateUnit}
                            onValueChange={(v) =>
                              handleUpdateTranslationRate(entry.id, { rateUnit: v as ServicePricingModel })
                            }
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRICING_MODELS.map((pm) => (
                                <SelectItem key={pm.value} value={pm.value}>
                                  {pm.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={entry.currency}
                            onValueChange={(v) =>
                              handleUpdateTranslationRate(entry.id, { currency: v as BillingCurrency })
                            }
                          >
                            <SelectTrigger className="h-8 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        {/* Update-004: Effective Date column */}
                        <TableCell>
                          <Input
                            type="date"
                            value={entry.effectiveDate || ''}
                            onChange={(e) =>
                              handleUpdateTranslationRate(entry.id, { effectiveDate: e.target.value })
                            }
                            className="h-8 w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="text"
                            value={entry.notes || ''}
                            onChange={(e) =>
                              handleUpdateTranslationRate(entry.id, { notes: e.target.value })
                            }
                            placeholder="—"
                            className="h-8 w-32 rounded border border-input bg-background px-2 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteTranslationRate(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {translationRates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No translation rates defined. Click &quot;Add Rate&quot; to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Add Translation Rate Dialog */}
          <Dialog open={addTranslationDialog} onOpenChange={setAddTranslationDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Translation Rate</DialogTitle>
                <DialogDescription>
                  Add a new language pair rate to the translation rate card.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="source">Source Language</Label>
                    <Select
                      value={newTranslationEntry.sourceLanguage}
                      onValueChange={(v) =>
                        setNewTranslationEntry({ ...newTranslationEntry, sourceLanguage: v })
                      }
                    >
                      <SelectTrigger id="source" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label} ({lang.value})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="target">Target Language</Label>
                    <Select
                      value={newTranslationEntry.targetLanguage}
                      onValueChange={(v) =>
                        setNewTranslationEntry({ ...newTranslationEntry, targetLanguage: v })
                      }
                    >
                      <SelectTrigger id="target" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label} ({lang.value})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rate">Rate</Label>
                    <input
                      id="rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newTranslationEntry.rate}
                      onChange={(e) =>
                        setNewTranslationEntry({
                          ...newTranslationEntry,
                          rate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={newTranslationEntry.rateUnit}
                      onValueChange={(v) =>
                        setNewTranslationEntry({ ...newTranslationEntry, rateUnit: v as ServicePricingModel })
                      }
                    >
                      <SelectTrigger id="unit" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRICING_MODELS.map((pm) => (
                          <SelectItem key={pm.value} value={pm.value}>
                            {pm.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={newTranslationEntry.currency}
                      onValueChange={(v) =>
                        setNewTranslationEntry({ ...newTranslationEntry, currency: v as BillingCurrency })
                      }
                    >
                      <SelectTrigger id="currency" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <input
                    id="notes"
                    type="text"
                    value={newTranslationEntry.notes || ''}
                    onChange={(e) =>
                      setNewTranslationEntry({ ...newTranslationEntry, notes: e.target.value })
                    }
                    placeholder="Additional notes..."
                    className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddTranslationDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTranslationRate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
