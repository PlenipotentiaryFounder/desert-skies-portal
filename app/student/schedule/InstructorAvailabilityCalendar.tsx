"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, User, Plane, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns"

interface TimeSlot {
  date: string
  startTime: string
  endTime: string
  duration: number
  available: boolean
}

interface AvailabilityData {
  instructorId: string
  workingHours: {
    start: string
    end: string
    days: number[]
  }
  existingSessions: any[]
  availableSlots: TimeSlot[]
  dateRange: {
    startDate: string
    endDate: string
  }
}

interface InstructorAvailabilityCalendarProps {
  instructorId: string
  onSlotSelect: (slot: TimeSlot) => void
  selectedSlot?: TimeSlot | null
}

export function InstructorAvailabilityCalendar({ 
  instructorId, 
  onSlotSelect, 
  selectedSlot 
}: InstructorAvailabilityCalendarProps) {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Fetch availability data
  const fetchAvailability = async (startDate: string, endDate: string) => {
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch(
        `/api/student/schedule/availability?instructorId=${instructorId}&startDate=${startDate}&endDate=${endDate}`
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch availability")
      }
      
      const data = await response.json()
      setAvailability(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch availability")
    } finally {
      setLoading(false)
    }
  }

  // Load availability when component mounts or week changes
  useEffect(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }) // Sunday
    
    fetchAvailability(
      format(weekStart, "yyyy-MM-dd"),
      format(weekEnd, "yyyy-MM-dd")
    )
  }, [instructorId, currentWeek])

  // Group slots by date
  const slotsByDate = availability?.availableSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = []
    }
    acc[slot.date].push(slot)
    return acc
  }, {} as Record<string, TimeSlot[]>) || {}

  // Get week days
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7))
  }

  const getDurationLabel = (minutes: number) => {
    if (minutes === 60) return "1 hour"
    if (minutes === 90) return "1.5 hours"
    if (minutes === 120) return "2 hours"
    if (minutes === 180) return "3 hours"
    return `${minutes / 60} hours`
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <Card variant="aviation">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aviation-sky-600 mx-auto mb-4"></div>
              <p className="text-aviation-sky-600">Loading instructor availability...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card variant="aviation">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="font-semibold mb-2">Unable to load availability</p>
            <p className="text-sm">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="aviation" 
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="aviation">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-aviation-sky-600" />
          Instructor Availability
        </CardTitle>
        <CardDescription>
          Select a date and time slot for your training session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigateWeek('prev')}
            className="flex items-center gap-2"
          >
            ← Previous Week
          </Button>
          
          <h3 className="text-lg font-semibold text-aviation-sky-900">
            {format(weekStart, "MMM d")} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d, yyyy")}
          </h3>
          
          <Button
            variant="outline"
            onClick={() => navigateWeek('next')}
            className="flex items-center gap-2"
          >
            Next Week →
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <div key={day} className="text-center font-semibold text-aviation-sky-700 py-2">
              {day}
            </div>
          ))}
          
          {/* Day Cells */}
          {weekDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd")
            const daySlots = slotsByDate[dateStr] || []
            const isToday = isSameDay(day, new Date())
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            
            return (
              <div
                key={dateStr}
                className={cn(
                  "min-h-[120px] p-2 border rounded-lg cursor-pointer transition-all",
                  isToday && "bg-aviation-sky-50 border-aviation-sky-200",
                  isSelected && "bg-aviation-sky-100 border-aviation-sky-400",
                  daySlots.length > 0 && "hover:bg-aviation-sky-50 hover:border-aviation-sky-300",
                  daySlots.length === 0 && "bg-gray-50 border-gray-200 cursor-not-allowed"
                )}
                onClick={() => daySlots.length > 0 && setSelectedDate(day)}
              >
                <div className="text-sm font-medium text-aviation-sky-900 mb-1">
                  {format(day, "d")}
                </div>
                <div className="text-xs text-aviation-sky-600">
                  {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                </div>
                {daySlots.length > 0 && (
                  <div className="mt-1">
                    <Badge variant="secondary" className="text-xs">
                      Available
                    </Badge>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Time Slots for Selected Date */}
        {selectedDate && slotsByDate[format(selectedDate, "yyyy-MM-dd")] && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-aviation-sky-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Available Times for {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {slotsByDate[format(selectedDate, "yyyy-MM-dd")].map((slot, index) => (
                <Button
                  key={`${slot.date}-${slot.startTime}-${slot.duration}`}
                  variant={selectedSlot?.date === slot.date && 
                           selectedSlot?.startTime === slot.startTime ? 
                           "default" : "outline"}
                  className={cn(
                    "h-auto p-4 flex flex-col items-start text-left",
                    selectedSlot?.date === slot.date && 
                    selectedSlot?.startTime === slot.startTime && 
                    "bg-aviation-sky-600 text-white hover:bg-aviation-sky-700"
                  )}
                  onClick={() => onSlotSelect(slot)}
                >
                  <div className="font-semibold">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </div>
                  <div className="text-sm opacity-80">
                    {getDurationLabel(slot.duration)}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Slot Summary */}
        {selectedSlot && (
          <Card className="bg-aviation-sky-50 border-aviation-sky-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-aviation-sky-900 mb-2 flex items-center gap-2">
                <Plane className="w-4 h-4" />
                Selected Session
              </h4>
              <div className="space-y-1 text-sm text-aviation-sky-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(parseISO(selectedSlot.date), "EEEE, MMMM d, yyyy")}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Duration: {getDurationLabel(selectedSlot.duration)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

