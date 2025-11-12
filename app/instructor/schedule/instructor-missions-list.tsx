"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar, 
  Clock, 
  Plane, 
  User, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  FileText,
  BookOpen,
  Filter,
  ChevronDown
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  aircraft: {
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

interface InstructorMissionsListProps {
  missions: Mission[]
}

export function InstructorMissionsList({ missions }: InstructorMissionsListProps) {
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'F' | 'G' | 'S'>('all')

  // Filter missions
  const filteredMissions = missions.filter(mission => {
    // Date filter
    const missionDate = new Date(mission.scheduled_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    let dateMatch = true
    if (filter === 'today') {
      const missionDateOnly = new Date(missionDate)
      missionDateOnly.setHours(0, 0, 0, 0)
      dateMatch = missionDateOnly.getTime() === today.getTime()
    } else if (filter === 'week') {
      dateMatch = missionDate >= today && missionDate <= weekFromNow
    }

    // Type filter
    const typeMatch = typeFilter === 'all' || mission.mission_type === typeFilter

    return dateMatch && typeMatch
  })

  // Group missions by date
  const groupedMissions = filteredMissions.reduce((groups: Record<string, Mission[]>, mission) => {
    const date = mission.scheduled_date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(mission)
    return groups
  }, {})

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const missionDate = new Date(date)
    missionDate.setHours(0, 0, 0, 0)

    if (missionDate.getTime() === today.getTime()) {
      return "Today"
    }

    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    if (missionDate.getTime() === tomorrow.getTime()) {
      return "Tomorrow"
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Time TBD'
    const [hours, minutes] = timeString.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getMissionTypeIcon = (type: string) => {
    switch (type) {
      case 'F': return { icon: Plane, label: 'Flight', color: 'text-blue-600' }
      case 'G': return { icon: BookOpen, label: 'Ground', color: 'text-green-600' }
      case 'S': return { icon: Plane, label: 'Simulator', color: 'text-purple-600' }
      default: return { icon: Plane, label: 'Training', color: 'text-gray-600' }
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getPOAStatus = (mission: Mission) => {
    if (!mission.plan_of_action_id) {
      return { label: 'Needs POA', color: 'destructive', icon: AlertTriangle }
    }
    if (mission.plan_of_action?.student_acknowledged_at) {
      return { label: 'Acknowledged', color: 'default', icon: CheckCircle }
    }
    if (mission.plan_of_action?.shared_with_student_at) {
      return { label: 'POA Shared', color: 'secondary', icon: CheckCircle }
    }
    return { label: 'POA Draft', color: 'outline', icon: FileText }
  }

  if (filteredMissions.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Missions Found</h3>
            <p className="text-muted-foreground mb-6">
              {filter === 'today' && "You don't have any missions scheduled for today"}
              {filter === 'week' && "You don't have any missions scheduled this week"}
              {filter === 'all' && "You don't have any upcoming missions"}
            </p>
            <Button asChild size="lg">
              <Link href="/instructor/missions/new">
                <Plane className="w-4 h-4 mr-2" />
                Schedule a Mission
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="shadow-sm">
              <Filter className="w-4 h-4 mr-2" />
              {filter === 'all' && 'All Time'}
              {filter === 'today' && 'Today'}
              {filter === 'week' && 'This Week'}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Time Filter</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilter('today')}>Today</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('week')}>This Week</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('all')}>All Time</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="shadow-sm">
              <Plane className="w-4 h-4 mr-2" />
              {typeFilter === 'all' && 'All Types'}
              {typeFilter === 'F' && 'Flight Only'}
              {typeFilter === 'G' && 'Ground Only'}
              {typeFilter === 'S' && 'Sim Only'}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Mission Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTypeFilter('all')}>All Types</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('F')}>Flight</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('G')}>Ground</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('S')}>Simulator</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1"></div>

        <Badge variant="outline" className="text-sm">
          {filteredMissions.length} {filteredMissions.length === 1 ? 'mission' : 'missions'}
        </Badge>
      </div>

      {/* Grouped Mission List */}
      <AnimatePresence mode="popLayout">
        {Object.entries(groupedMissions).map(([date, dateMissions]) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Date Header */}
            <div className="flex items-center gap-3 pb-2 border-b">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">{formatDate(date)}</h3>
              <Badge variant="secondary" className="ml-auto">
                {dateMissions.length} {dateMissions.length === 1 ? 'mission' : 'missions'}
              </Badge>
            </div>

            {/* Mission Cards */}
            <div className="space-y-3">
              {dateMissions.map((mission, index) => {
                const missionType = getMissionTypeIcon(mission.mission_type)
                const MissionIcon = missionType.icon
                const poaStatus = getPOAStatus(mission)
                const POAIcon = poaStatus.icon

                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Time Badge */}
                          <div className="text-center min-w-[80px]">
                            <div className="bg-primary/10 rounded-xl p-3">
                              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                              <p className="text-lg font-bold text-primary">
                                {formatTime(mission.scheduled_start_time)}
                              </p>
                            </div>
                          </div>

                          {/* Student Avatar & Info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border-2 border-primary/20">
                                  <AvatarImage src={mission.student?.avatar_url || ''} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {mission.student ? getInitials(mission.student.first_name, mission.student.last_name) : 'ST'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold text-lg">
                                    {mission.student ? `${mission.student.first_name} ${mission.student.last_name}` : 'Student TBD'}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {mission.lesson_template?.title || 'Custom Lesson'}
                                  </p>
                                </div>
                              </div>

                              {/* Mission Code & Type Badge */}
                              <div className="text-right space-y-2">
                                <p className="font-mono text-sm font-semibold text-primary">
                                  {mission.mission_code}
                                </p>
                                <Badge variant="outline" className={missionType.color}>
                                  <MissionIcon className="w-3 h-3 mr-1" />
                                  {missionType.label}
                                </Badge>
                              </div>
                            </div>

                            {/* Mission Details */}
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              {mission.aircraft && (
                                <div className="flex items-center gap-2">
                                  <Plane className="w-4 h-4" />
                                  <span>{mission.aircraft.tail_number} ({mission.aircraft.make} {mission.aircraft.model})</span>
                                </div>
                              )}
                            </div>

                            {/* POA Status & Actions */}
                            <div className="flex items-center gap-3 pt-2 border-t">
                              <Badge variant={poaStatus.color} className="flex items-center gap-1">
                                <POAIcon className="w-3 h-3" />
                                {poaStatus.label}
                              </Badge>

                              <div className="flex-1"></div>

                              <div className="flex items-center gap-2">
                                {!mission.plan_of_action_id ? (
                                  <Button size="sm" asChild>
                                    <Link href={`/instructor/missions/${mission.id}`}>
                                      <FileText className="w-4 h-4 mr-1" />
                                      Create POA
                                    </Link>
                                  </Button>
                                ) : (
                                  <>
                                    <Button size="sm" variant="outline" asChild>
                                      <Link href={`/instructor/missions/${mission.id}/pre-brief`}>
                                        <BookOpen className="w-4 h-4 mr-1" />
                                        Pre-Brief
                                      </Link>
                                    </Button>
                                    <Button size="sm" variant="outline" asChild>
                                      <Link href={`/instructor/missions/${mission.id}`}>
                                        <Eye className="w-4 h-4 mr-1" />
                                        Details
                                      </Link>
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}


