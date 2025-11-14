"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Calendar as BigCalendar, momentLocalizer, View, SlotInfo } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Plane,
  BookOpen,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye
} from "lucide-react"
import Link from "next/link"
import { ExpressScheduleModal, type ScheduleData } from "@/components/instructor/express-schedule-modal"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

const localizer = momentLocalizer(moment)

interface Mission {
  id: string
  mission_code: string
  mission_type: string
  scheduled_date: string
  scheduled_start_time: string | null
  status: string
  lesson_code: string | null
  plan_of_action_id: string | null
  student: {
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url: string | null
  } | null
  scheduled_aircraft: {
    id: string
    tail_number: string
    make: string
    model: string
  } | null
  actual_aircraft: {
    id: string
    tail_number: string
    make: string
    model: string
  } | null
  lesson_template: {
    id: string
    title: string
    description: string
    lesson_type: string
  } | null
  plan_of_action: {
    id: string
    status: string
    shared_with_student_at: string | null
    student_acknowledged_at: string | null
  } | null
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Mission
}

export function InstructorScheduleCalendar({ missions }: { missions: Mission[] }) {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // Express Schedule Modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [selectedSlotDate, setSelectedSlotDate] = useState<Date | undefined>()
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>("")
  const [students, setStudents] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [aircraft, setAircraft] = useState<any[]>([])
  
  const router = useRouter()
  const { toast } = useToast()

  // Fetch students and aircraft when modal opens
  useEffect(() => {
    if (scheduleModalOpen) {
      fetchStudentsAndAircraft()
    }
  }, [scheduleModalOpen])

  const fetchStudentsAndAircraft = async () => {
    try {
      // Fetch active students
      const studentsRes = await fetch('/api/instructor/students/active')
      if (studentsRes.ok) {
        const data = await studentsRes.json()
        setStudents(data.students || [])
      }

      // Fetch aircraft
      const aircraftRes = await fetch('/api/aircraft')
      if (aircraftRes.ok) {
        const data = await aircraftRes.json()
        setAircraft(data.aircraft || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  // Handle slot selection (click on empty calendar space)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    // Only allow scheduling future dates
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    const slotDate = new Date(slotInfo.start)
    slotDate.setHours(0, 0, 0, 0)
    
    if (slotDate < now) {
      toast({
        title: "Cannot schedule in the past",
        description: "Please select a future date",
        variant: "destructive"
      })
      return
    }

    setSelectedSlotDate(slotInfo.start)
    
    // Extract time from slot
    const hours = slotInfo.start.getHours()
    const minutes = slotInfo.start.getMinutes()
    setSelectedSlotTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
    
    setScheduleModalOpen(true)
  }, [toast])

  // Handle scheduling from modal
  const handleSchedule = async (scheduleData: ScheduleData) => {
    try {
      const response = await fetch('/api/instructor/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: scheduleData.enrollmentId,
          studentId: scheduleData.studentId,
          lessonId: scheduleData.lessonId,
          mode: 'precreated',
          missionType: scheduleData.missionType,
          date: scheduleData.date,
          startTime: scheduleData.startTime,
          aircraftId: scheduleData.aircraftId,
          generatePOA: scheduleData.generatePOA
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to schedule mission')
      }

      toast({
        title: 'Mission Scheduled!',
        description: 'Mission has been scheduled successfully.'
      })

      // Navigate to mission detail page
      router.push(`/instructor/missions/${result.data.id}`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule mission',
        variant: 'destructive'
      })
      throw error
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
      
      // Default duration: 2.5 hours for flight, 1 hour for ground, 2 hours for sim
      const defaultDuration = 
        mission.mission_type === 'G' ? 60 : 
        mission.mission_type === 'S' ? 120 : 150
      
      const endDate = new Date(missionDate.getTime() + defaultDuration * 60000)
      
      const studentName = mission.student 
        ? `${mission.student.first_name} ${mission.student.last_name}`
        : 'Student TBD'
      
      const missionTypeIcon = 
        mission.mission_type === 'F' ? '✈️' :
        mission.mission_type === 'G' ? '📚' :
        mission.mission_type === 'S' ? '🚀' : '✈️'
      
      return {
        id: mission.id,
        title: `${missionTypeIcon} ${studentName} - ${mission.mission_code}`,
        start: missionDate,
        end: endDate,
        resource: mission
      }
    })
  }, [missions])

  // Calculate day availability for heatmap
  const getDayAvailability = useCallback((date: Date): 'available' | 'busy' | 'full' | 'none' => {
    const dateStr = date.toISOString().split('T')[0]
    const dayEvents = events.filter(event => {
      const eventDate = event.start.toISOString().split('T')[0]
      return eventDate === dateStr
    })

    if (dayEvents.length === 0) return 'available'
    if (dayEvents.length >= 4) return 'full' // 4 or more missions = fully booked
    if (dayEvents.length >= 2) return 'busy' // 2-3 missions = busy
    return 'none' // 1 mission = has something but not busy
  }, [events])

  // Style events based on mission type and POA status
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const mission = event.resource
    
    let backgroundColor = '#3b82f6' // blue for flights
    if (mission.mission_type === 'G') backgroundColor = '#10b981' // green for ground
    if (mission.mission_type === 'S') backgroundColor = '#8b5cf6' // purple for sim
    
    // Add red border if POA is missing
    const border = !mission.plan_of_action_id ? '3px solid #ef4444' : '0px'
    
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border,
        display: 'block',
        padding: '4px 8px',
        fontSize: '0.875rem',
        fontWeight: '500'
      }
    }
  }, [])

  // Style day cells based on availability (heatmap)
  const dayPropGetter = useCallback((date: Date) => {
    const availability = getDayAvailability(date)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const isPast = date < now

    let style: any = {}

    if (!isPast) {
      switch (availability) {
        case 'available':
          // Green tint for available days
          style = {
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }
          break
        case 'busy':
          // Yellow tint for busy days
          style = {
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }
          break
        case 'full':
          // Red tint for fully booked days
          style = {
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }
          break
      }
    }

    return { style }
  }, [getDayAvailability])

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setDialogOpen(true)
  }

  const handleNavigate = (newDate: Date) => {
    setDate(newDate)
  }

  const handleViewChange = (newView: View) => {
    setView(newView)
  }

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      const newDate = new Date(date)
      if (view === 'month') {
        newDate.setMonth(date.getMonth() - 1)
      } else if (view === 'week') {
        newDate.setDate(date.getDate() - 7)
      } else {
        newDate.setDate(date.getDate() - 1)
      }
      setDate(newDate)
      toolbar.onNavigate('PREV', newDate)
    }

    const goToNext = () => {
      const newDate = new Date(date)
      if (view === 'month') {
        newDate.setMonth(date.getMonth() + 1)
      } else if (view === 'week') {
        newDate.setDate(date.getDate() + 7)
      } else {
        newDate.setDate(date.getDate() + 1)
      }
      setDate(newDate)
      toolbar.onNavigate('NEXT', newDate)
    }

    const goToToday = () => {
      const now = new Date()
      setDate(now)
      toolbar.onNavigate('TODAY', now)
    }

    const label = () => {
      const dateObj = date
      if (view === 'month') {
        return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      } else if (view === 'week') {
        const start = moment(dateObj).startOf('week')
        const end = moment(dateObj).endOf('week')
        return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`
      } else {
        return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      }
    }

    return (
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div className="flex items-center gap-2">
          <Button onClick={goToBack} variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button onClick={goToToday} variant="outline" size="sm">
            Today
          </Button>
          <Button onClick={goToNext} variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <h2 className="text-xl font-semibold">{label()}</h2>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleViewChange('month')}
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
          >
            Month
          </Button>
          <Button
            onClick={() => handleViewChange('week')}
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
          >
            Week
          </Button>
          <Button
            onClick={() => handleViewChange('day')}
            variant={view === 'day' ? 'default' : 'outline'}
            size="sm"
          >
            Day
          </Button>
        </div>
      </div>
    )
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <>
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-header {
          padding: 12px 8px;
          font-weight: 600;
          border-bottom: 2px solid #e5e7eb;
        }
        .rbc-today {
          background-color: #eff6ff;
        }
        .rbc-off-range-bg {
          background-color: #f9fafb;
        }
        .rbc-event {
          padding: 4px 8px;
          cursor: pointer;
        }
        .rbc-event:hover {
          opacity: 1 !important;
        }
        .rbc-time-slot {
          min-height: 40px;
        }
        .rbc-timeslot-group {
          min-height: 80px;
        }
        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }
      `}</style>

      <div className="space-y-4">
        {/* Legend */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="font-semibold text-muted-foreground">Mission Types:</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-600"></div>
              <span>Flight</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-600"></div>
              <span>Ground</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-600"></div>
              <span>Simulator</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-red-500"></div>
              <span>Needs POA</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="font-semibold text-muted-foreground">Day Availability:</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/30"></div>
              <span>Busy (2-3 missions)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30"></div>
              <span>Full (4+ missions)</span>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700 }}
            view={view}
            onView={handleViewChange}
            date={date}
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventStyleGetter}
            dayPropGetter={dayPropGetter}
            components={{
              toolbar: CustomToolbar
            }}
            views={['month', 'week', 'day']}
            step={30}
            showMultiDayTimes
            defaultDate={new Date()}
          />
        </div>
      </div>

      {/* Mission Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  {selectedEvent.resource.mission_code}
                </DialogTitle>
                <DialogDescription>
                  {selectedEvent.resource.lesson_template?.title || 'Custom Lesson'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Student Info */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage src={selectedEvent.resource.student?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                      {selectedEvent.resource.student 
                        ? getInitials(selectedEvent.resource.student.first_name, selectedEvent.resource.student.last_name)
                        : 'ST'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">
                      {selectedEvent.resource.student 
                        ? `${selectedEvent.resource.student.first_name} ${selectedEvent.resource.student.last_name}`
                        : 'Student TBD'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.resource.student?.email || 'Email not available'}
                    </p>
                  </div>
                </div>

                {/* Mission Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <p className="font-medium">
                        {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Mission Type</p>
                    <Badge variant="outline">
                      {selectedEvent.resource.mission_type === 'F' && '✈️ Flight'}
                      {selectedEvent.resource.mission_type === 'G' && '📚 Ground'}
                      {selectedEvent.resource.mission_type === 'S' && '🚀 Simulator'}
                    </Badge>
                  </div>

                  {selectedEvent.resource.aircraft && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-sm text-muted-foreground">Aircraft</p>
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4" />
                        <p className="font-medium">
                          {selectedEvent.resource.aircraft.tail_number} - {selectedEvent.resource.aircraft.make} {selectedEvent.resource.aircraft.model}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 col-span-2">
                    <p className="text-sm text-muted-foreground">POA Status</p>
                    {!selectedEvent.resource.plan_of_action_id ? (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" />
                        Needs Plan of Action
                      </Badge>
                    ) : selectedEvent.resource.plan_of_action?.student_acknowledged_at ? (
                      <Badge variant="default" className="flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" />
                        POA Acknowledged by Student
                      </Badge>
                    ) : selectedEvent.resource.plan_of_action?.shared_with_student_at ? (
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" />
                        POA Shared with Student
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <FileText className="w-3 h-3" />
                        POA Draft
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  {!selectedEvent.resource.plan_of_action_id ? (
                    <Button asChild className="flex-1">
                      <Link href={`/instructor/missions/${selectedEvent.resource.id}`} onClick={() => setDialogOpen(false)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Create Plan of Action
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild variant="outline" className="flex-1">
                        <Link href={`/instructor/missions/${selectedEvent.resource.id}/pre-brief`} onClick={() => setDialogOpen(false)}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Pre-Brief
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="flex-1">
                        <Link href={`/instructor/missions/${selectedEvent.resource.id}`} onClick={() => setDialogOpen(false)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Express Schedule Modal */}
      <ExpressScheduleModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        preselectedDate={selectedSlotDate}
        preselectedTime={selectedSlotTime}
        students={students}
        lessons={lessons}
        aircraft={aircraft}
        onSchedule={handleSchedule}
      />
    </>
  )
}


