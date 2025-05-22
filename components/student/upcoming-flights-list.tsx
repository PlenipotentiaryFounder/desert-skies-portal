"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Calendar, Clock } from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface UpcomingFlightsListProps {
  studentId: string
}

interface FlightSession {
  id: string
  date: string
  start_time: string
  end_time: string
  lesson: {
    title: string
  }
  instructor: {
    first_name: string
    last_name: string
  }
  aircraft: {
    tail_number: string
    make: string
    model: string
  }
}

const supabase = createClient()

export function UpcomingFlightsList({ studentId }: UpcomingFlightsListProps) {
  const [flights, setFlights] = useState<FlightSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFlights() {
      try {
        // Get active enrollment
        const { data: enrollments } = await supabase
          .from("student_enrollments")
          .select("id")
          .eq("student_id", studentId)
          .eq("status", "active")

        if (!enrollments || enrollments.length === 0) {
          setLoading(false)
          return
        }

        const enrollmentIds = enrollments.map((e) => e.id)

        // Get upcoming flight sessions
        const { data } = await supabase
          .from("flight_sessions")
          .select(`
            id,
            date,
            start_time,
            end_time,
            lesson:lesson_id (
              title
            ),
            instructor:instructor_id (
              first_name,
              last_name
            ),
            aircraft:aircraft_id (
              tail_number,
              make,
              model
            )
          `)
          .in("enrollment_id", enrollmentIds)
          .eq("status", "scheduled")
          .gte("date", new Date().toISOString().split("T")[0])
          .order("date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(5)

        setFlights((data as unknown as FlightSession[]) || [])
      } catch (error) {
        console.error("Error fetching upcoming flights:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFlights()
  }, [studentId])

  if (loading) {
    return <div className="flex items-center justify-center h-[300px]">Loading upcoming flights...</div>
  }

  if (flights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center">
        <p className="text-muted-foreground mb-4">No upcoming flights scheduled</p>
        <Button variant="outline">Schedule a Flight</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {flights.map((flight) => (
        <div key={flight.id} className="flex flex-col space-y-2 pb-4 border-b last:border-0">
          <div className="font-medium">{flight.lesson.title}</div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            {formatDate(flight.date)}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            {formatTime(flight.start_time)} - {formatTime(flight.end_time)}
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">With:</span> {flight.instructor.first_name}{" "}
            {flight.instructor.last_name}
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Aircraft:</span> {flight.aircraft.tail_number} (
            {flight.aircraft.make} {flight.aircraft.model})
          </div>
        </div>
      ))}
    </div>
  )
}
