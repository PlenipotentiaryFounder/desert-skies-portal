"use client"

import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plane, BookOpen, Rocket, Calendar as CalendarIcon } from 'lucide-react'
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

export function StudentScheduleCalendar({ missions }: { missions: Mission[] }) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [date, setDate] = useState(new Date())

  // Convert missions to calendar events
  const events = useMemo(() => {
    return missions
      .filter(m => m.status === 'scheduled' || m.status === 'in_progress')
      .map((mission): CalendarEvent => {
        const missionDate = new Date(mission.scheduled_date)
        
        if (mission.scheduled_start_time) {
          const [hours, minutes] = mission.scheduled_start_time.split(':')
          missionDate.setHours(parseInt(hours), parseInt(minutes))
        } else {
          // Default to 9 AM if no time specified
          missionDate.setHours(9, 0)
        }
        
        // Default duration: 2.5 hours for flight, 1 hour for ground, 2 hours for sim
        const defaultDuration = 
          mission.mission_type === 'G' ? 60 : 
          mission.mission_type === 'S' ? 120 : 150
        
        const endDate = new Date(missionDate.getTime() + defaultDuration * 60000)
        
        const missionTypeLabel = 
          mission.mission_type === 'F' ? '✈️ Flight' :
          mission.mission_type === 'G' ? '📚 Ground' :
          mission.mission_type === 'S' ? '🚀 Sim' : '✈️'
        
        return {
          id: mission.id,
          title: `${missionTypeLabel}: ${mission.mission_code}`,
          start: missionDate,
          end: endDate,
          resource: mission
        }
      })
  }, [missions])

  // Style events based on mission type
  const eventStyleGetter = (event: CalendarEvent) => {
    const mission = event.resource
    
    let backgroundColor = '#0ea5e9' // blue for flights (aviation-sky-500)
    let borderColor = '#0284c7' // aviation-sky-600
    
    if (mission.mission_type === 'G') {
      backgroundColor = '#10b981' // green-500
      borderColor = '#059669' // green-600
    }
    if (mission.mission_type === 'S') {
      backgroundColor = '#8b5cf6' // purple-500
      borderColor = '#7c3aed' // purple-600
    }
    
    if (mission.status === 'in_progress') {
      backgroundColor = '#f59e0b' // amber-500 for in-progress
      borderColor = '#d97706' // amber-600
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
        fontWeight: '500'
      }
    }
  }

  // Custom event component
  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    const mission = event.resource
    
    return (
      <div className="flex flex-col gap-0.5">
        <div className="font-semibold text-xs truncate">
          {event.title}
        </div>
        {mission.lesson_template?.title && (
          <div className="text-[10px] opacity-90 truncate">
            {mission.lesson_template.title}
          </div>
        )}
        {mission.plan_of_action_id && (
          <div className="text-[10px] opacity-90">✨ POA Ready</div>
        )}
      </div>
    )
  }

  // Show empty state if no missions
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Training Calendar
          </CardTitle>
          <CardDescription>Your upcoming training missions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Scheduled Missions</h3>
            <p className="text-muted-foreground mb-4">
              Contact your instructor to schedule your next training session
            </p>
            <Button variant="outline" asChild>
              <Link href="/student/schedule">
                View Full Schedule
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Training Calendar
            </CardTitle>
            <CardDescription>
              Showing {events.length} upcoming mission{events.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/schedule">
              View Full Schedule
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm mb-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-aviation-sky-500 rounded"></div>
            <Plane className="w-3 h-3" />
            <span className="text-xs">Flight</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <BookOpen className="w-3 h-3" />
            <span className="text-xs">Ground</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <Rocket className="w-3 h-3" />
            <span className="text-xs">Simulator</span>
          </div>
        </div>

        {/* Mini Calendar */}
        <div className="bg-white dark:bg-zinc-950 rounded-lg overflow-hidden border" style={{ height: '400px' }}>
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
              window.location.href = `/student/missions/${event.id}`
            }}
            views={['month', 'week']}
            defaultView="month"
            toolbar={true}
            popup={true}
            tooltipAccessor={(event) => {
              const mission = event.resource
              return `${event.title}${mission.instructor ? ` with ${mission.instructor.first_name} ${mission.instructor.last_name}` : ''}`
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

