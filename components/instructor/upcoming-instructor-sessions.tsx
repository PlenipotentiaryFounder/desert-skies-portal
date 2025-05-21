"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDate, formatTime } from "@/lib/utils"
import { Calendar, Clock, Plane } from "lucide-react"

interface FlightSession {
  id: string
  start_time: string
  end_time: string
  status: string
  aircraft_id: string
  student_id: string
  lesson_id: string
  students?: {
    first_name: string
    last_name: string
  }
  aircraft?: {
    registration: string
    model: string
  }
  lessons?: {
    title: string
  }
}

interface UpcomingInstructorSessionsProps {
  sessions: FlightSession[]
}

export function UpcomingInstructorSessions({ sessions }: UpcomingInstructorSessionsProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-6 text-center">
        <p className="text-muted-foreground mb-4">No upcoming flight sessions scheduled</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/instructor/schedule/new">Schedule New Flight</Link>
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div key={session.id} className="border rounded-md p-4 hover:bg-accent transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-medium">{session.lessons?.title || "Flight Session"}</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-4 w-4" />
                <span>{formatDate(session.start_time)}</span>
                <Clock className="ml-3 mr-1 h-4 w-4" />
                <span>
                  {formatTime(session.start_time)} - {formatTime(session.end_time)}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium mr-2">Student:</span>
                <span>
                  {session.students ? `${session.students.first_name} ${session.students.last_name}` : "Not assigned"}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Plane className="mr-1 h-4 w-4" />
                <span>
                  {session.aircraft
                    ? `${session.aircraft.model} (${session.aircraft.registration})`
                    : "Aircraft not assigned"}
                </span>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href={`/instructor/schedule/${session.id}`}>View Details</Link>
            </Button>
          </div>
        </div>
      ))}
      <div className="flex justify-center mt-4">
        <Button asChild variant="outline">
          <Link href="/instructor/schedule">View All Sessions</Link>
        </Button>
      </div>
    </div>
  )
}
