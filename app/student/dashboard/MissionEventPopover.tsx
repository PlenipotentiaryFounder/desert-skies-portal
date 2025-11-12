"use client"

import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plane,
  BookOpen,
  Rocket,
  Clock,
  User,
  Calendar as CalendarIcon,
  ExternalLink,
  RotateCcw,
  X,
  Sparkles
} from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

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

interface MissionEventPopoverProps {
  mission: Mission
  children: React.ReactNode
  onRescheduleRequest?: (missionId: string) => void
  onCancelRequest?: (missionId: string) => void
}

export function MissionEventPopover({
  mission,
  children,
  onRescheduleRequest,
  onCancelRequest
}: MissionEventPopoverProps) {
  const router = useRouter()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const getMissionTypeConfig = () => {
    switch (mission.mission_type) {
      case 'F':
        return {
          icon: <Plane className="w-4 h-4" />,
          label: 'Flight',
          color: 'text-aviation-sky-600',
          bgColor: 'bg-aviation-sky-50 dark:bg-aviation-sky-950/30',
          borderColor: 'border-aviation-sky-500'
        }
      case 'G':
        return {
          icon: <BookOpen className="w-4 h-4" />,
          label: 'Ground',
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/30',
          borderColor: 'border-green-500'
        }
      case 'S':
        return {
          icon: <Rocket className="w-4 h-4" />,
          label: 'Simulator',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-950/30',
          borderColor: 'border-purple-500'
        }
      default:
        return {
          icon: <Plane className="w-4 h-4" />,
          label: 'Training',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-500'
        }
    }
  }

  const typeConfig = getMissionTypeConfig()

  const handleViewDetails = () => {
    setOpen(false)
    router.push(`/student/missions/${mission.id}`)
  }

  const handleReschedule = () => {
    setOpen(false)
    onRescheduleRequest?.(mission.id)
    // TODO: Open reschedule modal or navigate to reschedule page
  }

  const handleCancelConfirm = async () => {
    setLoading(true)
    try {
      onCancelRequest?.(mission.id)
      // TODO: Call API to cancel mission
      setShowCancelDialog(false)
      setOpen(false)
    } catch (error) {
      console.error('Error canceling mission:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return 'Time TBD'
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="center" side="top">
          <div className="space-y-3 p-4">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className={cn("flex items-center gap-2 px-2 py-1 rounded-md", typeConfig.bgColor)}>
                  {typeConfig.icon}
                  <span className={cn("text-xs font-semibold uppercase tracking-wide", typeConfig.color)}>
                    {typeConfig.label}
                  </span>
                </div>
                {mission.plan_of_action_id && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30">
                    <Sparkles className="w-3 h-3" />
                    POA
                  </Badge>
                )}
              </div>
              
              <h3 className="font-bold text-lg leading-tight">{mission.mission_code}</h3>
              
              {mission.lesson_template?.title && (
                <p className="text-sm text-muted-foreground">
                  {mission.lesson_template.title}
                </p>
              )}
            </div>

            <Separator />

            {/* Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="w-4 h-4" />
                <span>{format(new Date(mission.scheduled_date), 'EEEE, MMM d, yyyy')}</span>
              </div>
              
              {mission.scheduled_start_time && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(mission.scheduled_start_time)}</span>
                </div>
              )}
              
              {mission.instructor && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>
                    {mission.instructor.first_name} {mission.instructor.last_name}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="default"
                size="sm"
                className="w-full justify-start"
                onClick={handleViewDetails}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Full Details
              </Button>
              
              {mission.status === 'scheduled' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleReschedule}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Request to Reschedule
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Mission
                  </Button>
                </>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Mission?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel <strong>{mission.mission_code}</strong> scheduled for{' '}
              {format(new Date(mission.scheduled_date), 'MMMM d, yyyy')}? This action will notify your instructor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>No, Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Canceling...' : 'Yes, Cancel Mission'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

