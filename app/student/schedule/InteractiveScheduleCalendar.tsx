"use client"

import { useEffect, useState, useMemo } from 'react'
import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import { Badge } from '@/components/ui/badge'
import { Plane, BookOpen, Rocket, CheckCircle, XCircle } from 'lucide-react'
import { DayClickModal } from '../dashboard/DayClickModal'
import { MissionEventPopover } from '../dashboard/MissionEventPopover'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

interface Mission {
  id: string
  mission_code: string
  mission_type: string
  status: string
  scheduled_date: string
  scheduled_start_time: string | null
  plan_of_action_id: string | null
  debrief_id: string | null
  lesson_template?: {
    title: string
  }
  instructor?: {
    first_name: string
    last_name: string
  }
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Mission
}

interface Availability {
  id: string
  date: string
  status: 'available' | 'not_available' | 'tentative'
  notes?: string
}

export function InteractiveScheduleCalendar({ missions }: { missions: Mission[] }) {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Fetch availability for current visible range
  useEffect(() => {
    fetchAvailability()
  }, [date, view])

  const fetchAvailability = async () => {
    try {
      let startDate, endDate
      
      if (view === 'month') {
        startDate = moment(date).startOf('month').format('YYYY-MM-DD')
        endDate = moment(date).endOf('month').format('YYYY-MM-DD')
      } else if (view === 'week') {
        startDate = moment(date).startOf('week').format('YYYY-MM-DD')
        endDate = moment(date).endOf('week').format('YYYY-MM-DD')
      } else {
        startDate = moment(date).format('YYYY-MM-DD')
        endDate = moment(date).format('YYYY-MM-DD')
      }
      
      const response = await fetch(
        `/api/student/availability?startDate=${startDate}&endDate=${endDate}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setAvailability(data.availability || [])
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    }
  }

  // Convert missions to calendar events
  const events = useMemo(() => {
    return missions.map((mission): CalendarEvent => {
      const missionDate = new Date(mission.scheduled_date)
      
      if (mission.scheduled_start_time) {
        const [hours, minutes] = mission.scheduled_start_time.split(':')
        missionDate.setHours(parseInt(hours), parseInt(minutes))
      } else {
        missionDate.setHours(9, 0)
      }
      
      const defaultDuration = 
        mission.mission_type === 'G' ? 60 : 
        mission.mission_type === 'S' ? 120 : 150
      
      const endDate = new Date(missionDate.getTime() + defaultDuration * 60000)
      
      const missionTypeLabel = 
        mission.mission_type === 'F' ? '✈️' :
        mission.mission_type === 'G' ? '📚' :
        mission.mission_type === 'S' ? '🚀' : '✈️'
      
      return {
        id: mission.id,
        title: `${missionTypeLabel} ${mission.mission_code}`,
        start: missionDate,
        end: endDate,
        resource: mission
      }
    })
  }, [missions])

  // Handle day click
  const handleSelectSlot = (slotInfo: { start: Date; end: Date; action: string }) => {
    if (slotInfo.action === 'click' || slotInfo.action === 'select') {
      setSelectedDate(slotInfo.start)
      setModalOpen(true)
    }
  }

  // Handle modal submission
  const handleModalSubmit = async (data: {
    action: 'request_flight' | 'set_availability'
    availability?: 'available' | 'not_available'
    timeSlot?: 'all_day' | 'morning' | 'afternoon' | 'evening' | 'night'
    notes?: string
  }) => {
    if (!selectedDate) return

    setLoading(true)
    try {
      if (data.action === 'request_flight') {
        const response = await fetch('/api/student/flight-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: format(selectedDate, 'yyyy-MM-dd'),
            notes: data.notes
          })
        })

        if (!response.ok) throw new Error('Failed to send request')

        toast({
          title: "Flight Request Sent! ✈️",
          description: "Your instructor will review and respond soon.",
        })
      } else {
        // Set availability with time slot
        const timeSlotMap = {
          all_day: { start: null, end: null },
          morning: { start: '06:00', end: '11:00' },
          afternoon: { start: '12:00', end: '15:00' },
          evening: { start: '15:00', end: '19:00' },
          night: { start: '20:00', end: '23:59' }
        }

        const timeRange = timeSlotMap[data.timeSlot || 'all_day']

        const response = await fetch('/api/student/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: format(selectedDate, 'yyyy-MM-dd'),
            status: data.availability,
            start_time: timeRange.start,
            end_time: timeRange.end,
            notes: data.notes
          })
        })

        if (!response.ok) throw new Error('Failed to set availability')

        const timeSlotLabel = data.timeSlot === 'all_day' ? '' : ` (${data.timeSlot})`
        toast({
          title: data.availability === 'available' 
            ? `Marked as Available${timeSlotLabel} ✅` 
            : "Marked as Not Available ❌",
          description: "Your calendar has been updated.",
        })

        fetchAvailability()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Style day cells based on availability
  const dayPropGetter = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayAvailability = availability.find(a => a.date === dateStr)
    
    if (dayAvailability) {
      if (dayAvailability.status === 'available') {
        return {
          style: {
            backgroundColor: '#f0fdf4',
            borderLeft: '3px solid #22c55e'
          }
        }
      } else if (dayAvailability.status === 'not_available') {
        return {
          style: {
            backgroundColor: '#fef2f2',
            borderLeft: '3px solid #ef4444'
          }
        }
      }
    }
    
    return {}
  }

  // Style events based on mission type
  const eventStyleGetter = (event: CalendarEvent) => {
    const mission = event.resource
    
    let backgroundColor = '#0ea5e9'
    let borderColor = '#0284c7'
    
    if (mission.mission_type === 'G') {
      backgroundColor = '#10b981'
      borderColor = '#059669'
    } else if (mission.mission_type === 'S') {
      backgroundColor = '#8b5cf6'
      borderColor = '#7c3aed'
    }
    
    if (mission.status === 'in_progress') {
      backgroundColor = '#f59e0b'
      borderColor = '#d97706'
    } else if (mission.status === 'completed') {
      backgroundColor = '#6b7280'
      borderColor = '#4b5563'
    } else if (mission.status === 'cancelled') {
      backgroundColor = '#ef4444'
      borderColor = '#dc2626'
    }
    
    return {
      style: {
        backgroundColor,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: '6px',
        color: 'white',
        border: `1px solid ${borderColor}`,
        padding: '4px 8px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer'
      }
    }
  }

  // Custom event component
  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    const mission = event.resource
    
    return (
      <MissionEventPopover
        mission={mission}
        onRescheduleRequest={() => {
          toast({
            title: "Reschedule Request",
            description: "Feature coming soon! Contact your instructor for now.",
          })
        }}
        onCancelRequest={() => {
          toast({
            title: "Cancel Request",
            description: "Feature coming soon! Contact your instructor for now.",
          })
        }}
      >
        <div className="flex flex-col gap-0.5 w-full h-full">
          <div className="font-semibold text-xs truncate">
            {event.title}
          </div>
          {mission.lesson_template?.title && (
            <div className="text-[10px] opacity-90 truncate">
              {mission.lesson_template.title}
            </div>
          )}
          {mission.plan_of_action_id && (
            <div className="text-[10px] opacity-90">✨ POA</div>
          )}
        </div>
      </MissionEventPopover>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="font-semibold">Mission Types:</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-aviation-sky-500 rounded"></div>
            <Plane className="w-4 h-4" />
            <span>Flight</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <BookOpen className="w-4 h-4" />
            <span>Ground</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <Rocket className="w-4 h-4" />
            <span>Simulator</span>
          </div>
          <div className="border-l pl-4 ml-2 font-semibold">Availability:</div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span>Not Available</span>
          </div>
        </div>

        {/* Calendar */}
        <div style={{ height: '700px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={(newView) => setView(newView)}
            date={date}
            onNavigate={(newDate) => setDate(newDate)}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventStyleGetter}
            dayPropGetter={dayPropGetter}
            components={{
              event: CustomEvent as any
            }}
            views={['month', 'week', 'day']}
            popup={false}
          />
        </div>
      </div>

      {/* Day Click Modal */}
      <DayClickModal
        date={selectedDate}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedDate(null)
        }}
        onSubmit={handleModalSubmit}
      />
    </>
  )
}

