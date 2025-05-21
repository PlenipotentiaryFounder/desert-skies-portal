"use client"

import { Calendar, Clock, Plane, User } from "lucide-react"
import type { FlightSession } from "@/lib/flight-session-service"
import { formatDate, formatTime, calculateDuration } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

interface FlightSessionDetailsProps {
  session: FlightSession
}

export function FlightSessionDetails({ session }: FlightSessionDetailsProps) {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "canceled":
        return "bg-red-100 text-red-800"
      case "no_show":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">Date</div>
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            {formatDate(session.date)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">Time</div>
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            {formatTime(session.start_time)} - {formatTime(session.end_time)} (
            {calculateDuration(session.start_time, session.end_time)})
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">Student</div>
          <div className="flex items-center">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            {session.student?.first_name} {session.student?.last_name}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">Instructor</div>
          <div className="flex items-center">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            {session.instructor?.first_name} {session.instructor?.last_name}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">Aircraft</div>
          <div className="flex items-center">
            <Plane className="mr-2 h-4 w-4 text-muted-foreground" />
            {session.aircraft?.tail_number} ({session.aircraft?.make} {session.aircraft?.model})
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">Status</div>
          <div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusBadgeClass(
                session.status,
              )}`}
            >
              {session.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">Hobbs Time</div>
          <div>
            Start: {session.hobbs_start.toFixed(1)} | End: {session.hobbs_end.toFixed(1)} | Total:{" "}
            {(session.hobbs_end - session.hobbs_start).toFixed(1)}
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-2">Lesson Information</h3>
        <div className="space-y-2">
          <div>
            <div className="text-sm font-medium">Title</div>
            <div>{session.lesson?.title}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Description</div>
            <div className="text-sm text-muted-foreground">{session.lesson?.description}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Type</div>
            <div className="capitalize">{session.lesson?.lesson_type.replace("_", " ")}</div>
          </div>
        </div>
      </div>

      {session.notes && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-2">Notes</h3>
            <div className="text-sm whitespace-pre-line">{session.notes}</div>
          </div>
        </>
      )}

      {session.weather_conditions && Object.values(session.weather_conditions).some(Boolean) && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-2">Weather Conditions</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {session.weather_conditions.wind && (
                <div>
                  <div className="text-sm font-medium">Wind</div>
                  <div className="text-sm">{session.weather_conditions.wind}</div>
                </div>
              )}
              {session.weather_conditions.visibility && (
                <div>
                  <div className="text-sm font-medium">Visibility</div>
                  <div className="text-sm">{session.weather_conditions.visibility}</div>
                </div>
              )}
              {session.weather_conditions.ceiling && (
                <div>
                  <div className="text-sm font-medium">Ceiling</div>
                  <div className="text-sm">{session.weather_conditions.ceiling}</div>
                </div>
              )}
              {session.weather_conditions.temperature && (
                <div>
                  <div className="text-sm font-medium">Temperature</div>
                  <div className="text-sm">{session.weather_conditions.temperature}</div>
                </div>
              )}
              {session.weather_conditions.altimeter && (
                <div>
                  <div className="text-sm font-medium">Altimeter</div>
                  <div className="text-sm">{session.weather_conditions.altimeter}</div>
                </div>
              )}
              {session.weather_conditions.conditions && (
                <div>
                  <div className="text-sm font-medium">Conditions</div>
                  <div className="text-sm">{session.weather_conditions.conditions}</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
