"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format, parseISO, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { CheckCircle, XCircle, Clock, Plus, Edit2, Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'

const localizer = momentLocalizer(moment)

interface AvailabilityRecord {
  id: string
  instructor_id: string
  date: string
  status: 'available' | 'not_available' | 'tentative'
  start_time: string | null
  end_time: string | null
  time_slot: 'all_day' | 'morning' | 'afternoon' | 'evening' | 'night' | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: AvailabilityRecord
}

const STATUS_COLORS = {
  available: '#10b981', // green
  not_available: '#ef4444', // red
  tentative: '#f59e0b', // amber
}

const STATUS_LABELS = {
  available: 'Available',
  not_available: 'Not Available',
  tentative: 'Tentative',
}

const TIME_SLOT_LABELS = {
  all_day: 'All Day',
  morning: 'Morning (6-11 AM)',
  afternoon: 'Afternoon (12-3 PM)',
  evening: 'Evening (3-7 PM)',
  night: 'Night (7 PM-12 AM)',
}

export function InstructorAvailabilityCalendar() {
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<AvailabilityRecord | null>(null)
  const [formData, setFormData] = useState({
    status: 'available' as 'available' | 'not_available' | 'tentative',
    time_slot: 'all_day' as 'all_day' | 'morning' | 'afternoon' | 'evening' | 'night',
    notes: '',
  })

  useEffect(() => {
    fetchAvailability()
  }, [date])

  const fetchAvailability = async () => {
    setLoading(true)
    try {
      const start = format(startOfWeek(date), 'yyyy-MM-dd')
      const end = format(endOfWeek(addDays(date, 30)), 'yyyy-MM-dd') // Fetch ~5 weeks
      
      const response = await fetch(`/api/instructor/availability?start_date=${start}&end_date=${end}`)
      if (!response.ok) throw new Error('Failed to fetch availability')
      
      const data = await response.json()
      setAvailability(data.availability || [])
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast.error('Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  const events: CalendarEvent[] = availability.map(record => {
    const recordDate = parseISO(record.date)
    
    // Default time ranges based on time_slot
    let startHour = 0
    let endHour = 24
    
    if (record.time_slot === 'morning') {
      startHour = 6
      endHour = 11
    } else if (record.time_slot === 'afternoon') {
      startHour = 12
      endHour = 15
    } else if (record.time_slot === 'evening') {
      startHour = 15
      endHour = 19
    } else if (record.time_slot === 'night') {
      startHour = 19
      endHour = 24
    }
    
    const start = new Date(recordDate)
    start.setHours(startHour, 0, 0, 0)
    
    const end = new Date(recordDate)
    end.setHours(endHour, 0, 0, 0)
    
    return {
      id: record.id,
      title: `${STATUS_LABELS[record.status]}${record.time_slot !== 'all_day' ? ` - ${TIME_SLOT_LABELS[record.time_slot!]}` : ''}`,
      start,
      end,
      resource: record,
    }
  })

  const eventStyleGetter = (event: CalendarEvent) => {
    const style: React.CSSProperties = {
      backgroundColor: STATUS_COLORS[event.resource.status],
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: 'none',
      display: 'block',
      fontSize: '0.85rem',
      padding: '2px 5px',
    }
    return { style }
  }

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedDate(slotInfo.start)
    setSelectedRecord(null)
    setFormData({ status: 'available', time_slot: 'all_day', notes: '' })
    setIsModalOpen(true)
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedRecord(event.resource)
    setSelectedDate(parseISO(event.resource.date))
    setFormData({
      status: event.resource.status,
      time_slot: event.resource.time_slot || 'all_day',
      notes: event.resource.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!selectedDate) return
    
    try {
      if (selectedRecord) {
        // Update existing
        const response = await fetch('/api/instructor/availability', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedRecord.id,
            status: formData.status,
            time_slot: formData.time_slot,
            notes: formData.notes,
          }),
        })
        
        if (!response.ok) throw new Error('Failed to update availability')
        toast.success('Availability updated!')
      } else {
        // Create new
        const response = await fetch('/api/instructor/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: format(selectedDate, 'yyyy-MM-dd'),
            status: formData.status,
            time_slot: formData.time_slot,
            notes: formData.notes,
          }),
        })
        
        if (!response.ok) throw new Error('Failed to create availability')
        toast.success('Availability saved!')
      }
      
      setIsModalOpen(false)
      fetchAvailability()
    } catch (error) {
      console.error('Error saving availability:', error)
      toast.error('Failed to save availability')
    }
  }

  const handleDelete = async () => {
    if (!selectedRecord) return
    
    try {
      const response = await fetch(`/api/instructor/availability?id=${selectedRecord.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete availability')
      toast.success('Availability deleted!')
      setIsModalOpen(false)
      fetchAvailability()
    } catch (error) {
      console.error('Error deleting availability:', error)
      toast.error('Failed to delete availability')
    }
  }

  if (loading) {
    return <Skeleton className="h-[600px] w-full rounded-xl" />
  }

  return (
    <>
      <Card className="shadow-xl border border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            My Availability Calendar
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Click on any day to set your availability. Green = Available, Red = Not Available, Amber = Tentative.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] w-full">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              date={date}
              onNavigate={setDate}
              eventPropGetter={eventStyleGetter}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              popup
              views={['month', 'week', 'day']}
              defaultView="month"
            />
          </div>
          
          {/* Mobile-Friendly Legend */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-green-500 text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Available
            </Badge>
            <Badge className="bg-red-500 text-white">
              <XCircle className="w-3 h-3 mr-1" />
              Not Available
            </Badge>
            <Badge className="bg-amber-500 text-white">
              <Clock className="w-3 h-3 mr-1" />
              Tentative
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Availability Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRecord ? 'Edit Availability' : 'Set Availability'}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Available
                    </div>
                  </SelectItem>
                  <SelectItem value="not_available">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      Not Available
                    </div>
                  </SelectItem>
                  <SelectItem value="tentative">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Tentative
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time_slot">Time Period</Label>
              <Select 
                value={formData.time_slot} 
                onValueChange={(value: any) => setFormData({ ...formData, time_slot: value })}
              >
                <SelectTrigger id="time_slot">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_day">All Day</SelectItem>
                  <SelectItem value="morning">Morning (6-11 AM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12-3 PM)</SelectItem>
                  <SelectItem value="evening">Evening (3-7 PM)</SelectItem>
                  <SelectItem value="night">Night (7 PM-12 AM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about your availability..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedRecord && (
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                className="w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="w-full sm:w-auto"
            >
              {selectedRecord ? (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Update
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


