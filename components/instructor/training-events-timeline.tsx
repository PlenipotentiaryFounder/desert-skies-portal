"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, Play, Timer, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface TrainingEventsTimelineProps {
  missionId: string
  events: any[]
  missionStatus: string
}

export function TrainingEventsTimeline({ 
  missionId, 
  events, 
  missionStatus 
}: TrainingEventsTimelineProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [startingEvent, setStartingEvent] = useState<string | null>(null)
  const [completingEvent, setCompletingEvent] = useState<string | null>(null)

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'scheduled': return 'secondary'
      case 'in_progress': return 'outline'
      case 'cancelled': return 'destructive'
      default: return 'outline'
    }
  }

  const getEventIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'scheduled': return <Clock className="w-4 h-4 text-gray-400" />
      case 'in_progress': return <Timer className="w-4 h-4 text-blue-600 animate-pulse" />
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getEventTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  async function handleStartEvent(eventId: string) {
    setStartingEvent(eventId)
    try {
      const response = await fetch(`/api/instructor/training-events/${eventId}/start`, {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to start event")
      }

      toast({
        title: "Event Started",
        description: "The training event has been started.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setStartingEvent(null)
    }
  }

  async function handleCompleteEvent(eventId: string) {
    setCompletingEvent(eventId)
    try {
      const response = await fetch(`/api/instructor/training-events/${eventId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // These would be filled in by a form in a real implementation
          actual_duration_minutes: 30,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to complete event")
      }

      toast({
        title: "Event Completed",
        description: `Charged: $${(result.data.student_charge_cents / 100).toFixed(2)}`,
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setCompletingEvent(null)
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No training events created yet</p>
        <p className="text-sm">Events will be created automatically when the mission is scheduled</p>
      </div>
    )
  }

  // Sort events by logical order
  const eventOrder = ['pre_brief', 'flight', 'ground', 'simulator', 'post_brief']
  const sortedEvents = [...events].sort((a, b) => {
    return eventOrder.indexOf(a.event_type) - eventOrder.indexOf(b.event_type)
  })

  return (
    <div className="space-y-4">
      {sortedEvents.map((event, index) => {
        const isLast = index === sortedEvents.length - 1
        const canStart = event.status === 'scheduled' && missionStatus !== 'cancelled'
        const canComplete = event.status === 'in_progress'

        return (
          <div key={event.id} className="relative">
            {/* Timeline connector */}
            {!isLast && (
              <div className="absolute left-[15px] top-[40px] bottom-[-16px] w-0.5 bg-border" />
            )}

            {/* Event card */}
            <div className="flex gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center relative z-10">
                {getEventIcon(event.status)}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">
                      {getEventTypeLabel(event.event_type)}
                    </div>
                    {event.scheduled_duration_minutes && (
                      <div className="text-sm text-muted-foreground">
                        Scheduled: {event.scheduled_duration_minutes} minutes
                      </div>
                    )}
                    {event.actual_duration_minutes && (
                      <div className="text-sm text-muted-foreground">
                        Actual: {event.actual_duration_minutes} minutes
                      </div>
                    )}
                    {event.student_charge_cents > 0 && (
                      <div className="text-sm font-medium text-green-600 mt-1">
                        ${(event.student_charge_cents / 100).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getEventStatusColor(event.status)} className="capitalize">
                      {event.status}
                    </Badge>
                    {canStart && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStartEvent(event.id)}
                        disabled={startingEvent === event.id}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        {startingEvent === event.id ? "Starting..." : "Start"}
                      </Button>
                    )}
                    {canComplete && (
                      <Button 
                        size="sm"
                        onClick={() => handleCompleteEvent(event.id)}
                        disabled={completingEvent === event.id}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {completingEvent === event.id ? "Completing..." : "Complete"}
                      </Button>
                    )}
                  </div>
                </div>

                {event.notes && (
                  <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    {event.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

