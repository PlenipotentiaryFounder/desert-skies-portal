"use client"

import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plane, BookOpen, Rocket } from 'lucide-react'
import Link from 'next/link'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

interface Mission {
  id: string
  mission_code: string
  mission_type: string
  status: string
  scheduled_date: string
  scheduled_start_time: string | null
  lesson_template?: {
    title: string
  }
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Mission
}

export function StudentMissionsCalendar({ missions }: { missions: Mission[] }) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [date, setDate] = useState(new Date())

  const events = useMemo(() => {
    return missions.map((mission): CalendarEvent => {
      const missionDate = new Date(mission.scheduled_date)
      
      if (mission.scheduled_start_time) {
        const [hours, minutes] = mission.scheduled_start_time.split(':')
        missionDate.setHours(parseInt(hours), parseInt(minutes))
      }
      
      // Default duration: 2 hours for flight/sim, 1 hour for ground
      const defaultDuration = mission.mission_type === 'G' ? 60 : 120
      const endDate = new Date(missionDate.getTime() + defaultDuration * 60000)
      
      const missionTypeLabel = 
        mission.mission_type === 'F' ? 'Flight' :
        mission.mission_type === 'G' ? 'Ground' :
        mission.mission_type === 'S' ? 'Sim' : 'Training'
      
      return {
        id: mission.id,
        title: `${mission.mission_code} - ${missionTypeLabel}`,
        start: missionDate,
        end: endDate,
        resource: mission
      }
    })
  }, [missions])

  const eventStyleGetter = (event: CalendarEvent) => {
    const mission = event.resource
    
    let backgroundColor = '#3b82f6' // blue for flights
    if (mission.mission_type === 'G') backgroundColor = '#10b981' // green for ground
    if (mission.mission_type === 'S') backgroundColor = '#8b5cf6' // purple for sim
    
    if (mission.status === 'completed') backgroundColor = '#6b7280' // gray for completed
    if (mission.status === 'cancelled') backgroundColor = '#ef4444' // red for cancelled
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: mission.status === 'completed' ? 0.6 : 1,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    const mission = event.resource
    const Icon = 
      mission.mission_type === 'F' ? Plane :
      mission.mission_type === 'G' ? BookOpen :
      mission.mission_type === 'S' ? Rocket : Plane
    
    return (
      <div className="flex items-center gap-1 p-1">
        <Icon className="w-3 h-3" />
        <span className="text-xs font-medium truncate">{event.title}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
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
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded opacity-60"></div>
              <span>Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg" style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={(newView) => setView(newView as 'month' | 'week' | 'day')}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          eventPropGetter={eventStyleGetter}
          components={{
            event: CustomEvent as any
          }}
          onSelectEvent={(event) => {
            // Navigate to mission detail
            window.location.href = `/student/missions/${event.id}`
          }}
          views={['month', 'week', 'day']}
          popup
        />
      </div>
    </div>
  )
}

