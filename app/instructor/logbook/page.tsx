"use client"

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format, parseISO } from 'date-fns'
import { Plane, Calendar, Clock, User, FileText, Download, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface LogbookEntry {
  id: string
  date: string
  aircraft: {
    tail_number: string
    make: string
    model: string
  }
  total_time: number
  pic_time: number
  dual_given: number
  cross_country_time: number
  night_time: number
  instrument_time: number
  landings_day: number
  landings_night: number
  remarks: string | null
  status: 'draft' | 'final' | 'voided'
  mission_id: string | null
}

export default function InstructorLogbookPage() {
  const [entries, setEntries] = useState<LogbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<LogbookEntry | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [totals, setTotals] = useState({
    totalTime: 0,
    picTime: 0,
    dualGiven: 0,
    crossCountry: 0,
    night: 0,
    instrument: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchLogbookEntries()
  }, [])

  const fetchLogbookEntries = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('flight_log_entries')
        .select(`
          *,
          aircraft:aircraft_id(tail_number, make, model)
        `)
        .eq('student_id', user.id) // For instructor's logbook, student_id IS the instructor
        .order('date', { ascending: false })

      if (error) throw error

      setEntries(data || [])
      
      // Calculate totals
      const totals = (data || []).reduce((acc, entry) => ({
        totalTime: acc.totalTime + Number(entry.total_time || 0),
        picTime: acc.picTime + Number(entry.pic_time || 0),
        dualGiven: acc.dualGiven + Number(entry.dual_given || 0),
        crossCountry: acc.crossCountry + Number(entry.cross_country_time || 0),
        night: acc.night + Number(entry.night_time || 0),
        instrument: acc.instrument + Number(entry.instrument_time || 0),
      }), { totalTime: 0, picTime: 0, dualGiven: 0, crossCountry: 0, night: 0, instrument: 0 })
      
      setTotals(totals)
    } catch (error) {
      console.error('Error fetching logbook:', error)
      toast.error('Failed to load logbook')
    } finally {
      setLoading(false)
    }
  }

  const openDetails = (entry: LogbookEntry) => {
    setSelectedEntry(entry)
    setIsDetailsOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'final':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Final</Badge>
      case 'draft':
        return <Badge variant="outline" className="text-amber-500 border-amber-500"><Clock className="w-3 h-3 mr-1" />Draft</Badge>
      case 'voided':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Voided</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">My Instructor Logbook</h1>
            <p className="text-muted-foreground">
              Digital record of all your flight instruction hours
            </p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          <Card className="p-4 bg-blue-50/50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
            <div className="text-sm text-muted-foreground">Total Time</div>
            <div className="text-2xl font-bold">{totals.totalTime.toFixed(1)}</div>
          </Card>
          <Card className="p-4 bg-green-50/50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
            <div className="text-sm text-muted-foreground">PIC</div>
            <div className="text-2xl font-bold">{totals.picTime.toFixed(1)}</div>
          </Card>
          <Card className="p-4 bg-purple-50/50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700">
            <div className="text-sm text-muted-foreground">Dual Given</div>
            <div className="text-2xl font-bold">{totals.dualGiven.toFixed(1)}</div>
          </Card>
          <Card className="p-4 bg-orange-50/50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700">
            <div className="text-sm text-muted-foreground">Cross Country</div>
            <div className="text-2xl font-bold">{totals.crossCountry.toFixed(1)}</div>
          </Card>
          <Card className="p-4 bg-indigo-50/50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700">
            <div className="text-sm text-muted-foreground">Night</div>
            <div className="text-2xl font-bold">{totals.night.toFixed(1)}</div>
          </Card>
          <Card className="p-4 bg-amber-50/50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700">
            <div className="text-sm text-muted-foreground">Instrument</div>
            <div className="text-2xl font-bold">{totals.instrument.toFixed(1)}</div>
          </Card>
        </div>
      </div>

      {/* Logbook Entries */}
      <Card className="shadow-xl border border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle>Logbook Entries</CardTitle>
          <CardDescription>
            {entries.length} total entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No Logbook Entries</p>
              <p className="text-muted-foreground">
                Logbook entries are automatically created when you complete debriefs for flight missions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Aircraft</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">PIC</TableHead>
                    <TableHead className="text-right">Dual Given</TableHead>
                    <TableHead className="text-right">XC</TableHead>
                    <TableHead className="text-right">Night</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow 
                      key={entry.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openDetails(entry)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(parseISO(entry.date), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-muted-foreground" />
                          {entry.aircraft?.tail_number || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{entry.total_time.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{entry.pic_time.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{entry.dual_given.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{entry.cross_country_time.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{entry.night_time.toFixed(1)}</TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openDetails(entry)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Logbook Entry Details
            </DialogTitle>
            <DialogDescription>
              {selectedEntry && format(parseISO(selectedEntry.date), 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Aircraft</h4>
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedEntry.aircraft?.tail_number}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedEntry.aircraft?.make} {selectedEntry.aircraft?.model}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Status</h4>
                  {getStatusBadge(selectedEntry.status)}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Flight Times</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-md bg-muted">
                    <div className="text-muted-foreground">Total Time</div>
                    <div className="text-lg font-bold">{selectedEntry.total_time.toFixed(1)}</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted">
                    <div className="text-muted-foreground">PIC</div>
                    <div className="text-lg font-bold">{selectedEntry.pic_time.toFixed(1)}</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted">
                    <div className="text-muted-foreground">Dual Given</div>
                    <div className="text-lg font-bold">{selectedEntry.dual_given.toFixed(1)}</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted">
                    <div className="text-muted-foreground">Cross Country</div>
                    <div className="text-lg font-bold">{selectedEntry.cross_country_time.toFixed(1)}</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted">
                    <div className="text-muted-foreground">Night</div>
                    <div className="text-lg font-bold">{selectedEntry.night_time.toFixed(1)}</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted">
                    <div className="text-muted-foreground">Instrument</div>
                    <div className="text-lg font-bold">{selectedEntry.instrument_time.toFixed(1)}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Landings</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-md bg-muted">
                    <div className="text-muted-foreground">Day</div>
                    <div className="text-lg font-bold">{selectedEntry.landings_day}</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted">
                    <div className="text-muted-foreground">Night</div>
                    <div className="text-lg font-bold">{selectedEntry.landings_night}</div>
                  </div>
                </div>
              </div>

              {selectedEntry.remarks && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Remarks</h4>
                  <div className="p-3 rounded-md bg-muted text-sm">
                    {selectedEntry.remarks}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


