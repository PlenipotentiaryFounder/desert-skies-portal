"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Plane, User, CalendarDays, Plus, History, Eye, Edit } from 'lucide-react'
import { motion } from 'framer-motion'

interface FlightSession {
  id: string
  date: string
  start_time: string
  end_time: string
  lesson_name?: string
  instructor_name?: string
  aircraft_name?: string
  status: string
}

interface TrainingScheduleProps {
  upcomingSessions: FlightSession[]
  onRequestSession?: () => void
  onViewSession?: (sessionId: string) => void
  onEditSession?: (sessionId: string) => void
}

export function TrainingSchedule({ 
  upcomingSessions, 
  onRequestSession, 
  onViewSession, 
  onEditSession 
}: TrainingScheduleProps) {
  const [viewMode, setViewMode] = useState<'upcoming' | 'history'>('upcoming')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'default'
      case 'confirmed':
        return 'default'
      case 'completed':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Flight Schedule
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant={viewMode === 'upcoming' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('upcoming')}
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Upcoming
              </Button>
              <Button 
                variant={viewMode === 'history' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('history')}
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={onRequestSession}
              >
                <Plus className="w-4 h-4 mr-2" />
                Request Session
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'upcoming' ? (
            <div className="space-y-4">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Sessions</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any scheduled flight sessions.
                  </p>
                  <Button onClick={onRequestSession}>
                    <Plus className="w-4 h-4 mr-2" />
                    Request Your First Session
                  </Button>
                </div>
              ) : (
                upcomingSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">
                          {formatTime(session.start_time)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(session.date)}
                        </p>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {session.lesson_name || 'Flight Training Session'}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {session.instructor_name || 'TBD'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Plane className="w-3 h-3" />
                            {session.aircraft_name || 'TBD'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewSession?.(session.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditSession?.(session.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-8">
                <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Session History</h3>
                <p className="text-muted-foreground">
                  Your completed flight sessions will appear here.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Sessions</p>
                <p className="text-2xl font-bold">{upcomingSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Next Session</p>
                <p className="text-lg font-semibold">
                  {upcomingSessions.length > 0 
                    ? formatDate(upcomingSessions[0].date)
                    : 'None Scheduled'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 