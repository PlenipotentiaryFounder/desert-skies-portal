"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScheduleEvent {
  id: string
  title: string
  date: string
  start_time: string
  end_time?: string
  type: string
  student_name?: string
}

interface ScheduleCalendarProps {
  instructorId: string
  selectedDate?: string
  selectedTime?: string
  onDateTimeSelect: (date: string, time: string) => void
}

export function ScheduleCalendar({
  instructorId,
  selectedDate,
  selectedTime,
  onDateTimeSelect
}: ScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(
    selectedDate ? new Date(selectedDate) : null
  )

  // Fetch instructor's schedule
  useEffect(() => {
    fetchSchedule()
  }, [currentMonth, instructorId])

  async function fetchSchedule() {
    setLoading(true)
    try {
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      
      const res = await fetch(
        `/api/instructor/schedule?start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
        { credentials: 'include' }
      )
      
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
      }
    } catch (err) {
      console.error("Error fetching schedule:", err)
    } finally {
      setLoading(false)
    }
  }

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function previousMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  function handleDayClick(day: number) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    setSelectedDay(date)
  }

  function handleTimeSlotClick(time: string) {
    if (!selectedDay) return
    
    const dateStr = selectedDay.toISOString().split('T')[0]
    onDateTimeSelect(dateStr, time)
  }

  // Get events for a specific date
  function getEventsForDate(day: number): ScheduleEvent[] {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateStr = date.toISOString().split('T')[0]
    
    return events.filter(event => event.date === dateStr)
  }

  // Generate time slots (6 AM to 8 PM)
  const timeSlots = []
  for (let hour = 6; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
    if (hour < 20) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
  }

  // Check if a time slot is available
  function isTimeSlotAvailable(timeSlot: string): boolean {
    if (!selectedDay) return true
    
    const dateStr = selectedDay.toISOString().split('T')[0]
    const dayEvents = events.filter(event => event.date === dateStr)
    
    // Simple check - consider slot unavailable if any event overlaps
    return !dayEvents.some(event => {
      const eventStart = event.start_time
      const eventEnd = event.end_time || event.start_time
      return timeSlot >= eventStart && timeSlot <= eventEnd
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="w-4 h-4" />
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={previousMonth} className="h-8 w-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs">
            Click a date to view available time slots
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-0.5">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
              date.setHours(0, 0, 0, 0)
              const isPast = date < today
              const isToday = date.getTime() === today.getTime()
              const isSelected = selectedDay?.getTime() === date.getTime()
              const dayEvents = getEventsForDate(day)
              
              return (
                <button
                  key={day}
                  onClick={() => !isPast && handleDayClick(day)}
                  disabled={isPast}
                  className={cn(
                    "aspect-square p-1 rounded text-xs relative transition-all",
                    "hover:bg-accent hover:text-accent-foreground",
                    isPast && "text-muted-foreground cursor-not-allowed opacity-40",
                    isToday && "font-bold border border-primary",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary/90 font-bold",
                    !isSelected && !isPast && !isToday && "hover:border hover:border-border"
                  )}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="leading-none">{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Time Slot Selection */}
      {selectedDay && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-4 h-4" />
              {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </CardTitle>
            <CardDescription className="text-xs">
              Select a time slot for the mission
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
              {timeSlots.map(timeSlot => {
                const available = isTimeSlotAvailable(timeSlot)
                const isSelectedTime = selectedTime === timeSlot
                
                return (
                  <Button
                    key={timeSlot}
                    variant={isSelectedTime ? "default" : available ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => handleTimeSlotClick(timeSlot)}
                    disabled={!available}
                    className={cn(
                      "h-8 text-xs font-medium",
                      !available && "opacity-30 cursor-not-allowed"
                    )}
                  >
                    {timeSlot}
                  </Button>
                )
              })}
            </div>

            {/* Show events for selected day */}
            {getEventsForDate(selectedDay.getDate()).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase">Scheduled Events</h4>
                {getEventsForDate(selectedDay.getDate()).map(event => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-2.5 bg-muted/50 rounded border border-border"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{event.title}</div>
                      {event.student_name && (
                        <div className="text-xs text-muted-foreground truncate">
                          with {event.student_name}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs ml-2 shrink-0">
                      {event.start_time}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

