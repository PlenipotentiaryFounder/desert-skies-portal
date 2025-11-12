"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  CheckCircle, 
  X, 
  Edit,
  FileText,
  Sparkles,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"

interface MissionActionsPanelProps {
  mission: any
  trainingEvents: any[]
}

export function MissionActionsPanel({ mission, trainingEvents }: MissionActionsPanelProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [cancelling, setCancelling] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")

  const canStartPreBrief = mission.status === 'scheduled' && mission.plan_of_action_id
  const canGeneratePOA = mission.status === 'scheduled' && !mission.plan_of_action_id
  const canStartDebrief = (mission.status === 'in_progress' || mission.status === 'completed') && !mission.debrief_id
  const canComplete = mission.status === 'in_progress' && mission.debrief_id
  const canCancel = mission.status === 'scheduled' || mission.status === 'in_progress'
  const canEdit = mission.status === 'scheduled'

  async function handleCompleteMission() {
    setCompleting(true)
    try {
      const response = await fetch(`/api/instructor/missions/${mission.id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to complete mission")
      }

      toast({
        title: "Mission Completed!",
        description: "The mission has been marked as completed.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setCompleting(false)
    }
  }

  async function handleCancelMission() {
    if (!cancellationReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancellation",
        variant: "destructive",
      })
      return
    }

    setCancelling(true)
    try {
      const response = await fetch(`/api/instructor/missions/${mission.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: cancellationReason }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to cancel mission")
      }

      toast({
        title: "Mission Cancelled",
        description: "The mission has been cancelled.",
      })

      router.push("/instructor/missions")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setCancelling(false)
    }
  }

  async function handleGeneratePOA() {
    try {
      const response = await fetch(`/api/instructor/missions/${mission.id}/generate-poa`, {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate Plan of Action")
      }

      toast({
        title: "Plan of Action Generated!",
        description: "The POA has been created successfully.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>Manage this mission</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {canGeneratePOA && (
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleGeneratePOA}
          >
            <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
            Generate Plan of Action
          </Button>
        )}

        {canStartPreBrief && (
          <Button variant="default" className="w-full justify-start" asChild>
            <Link href={`/instructor/missions/${mission.id}/pre-brief`}>
              <Play className="w-4 h-4 mr-2" />
              Start Pre-Brief
            </Link>
          </Button>
        )}

        {canStartDebrief && (
          <Button variant="default" className="w-full justify-start" asChild>
            <Link href={`/instructor/missions/${mission.id}/debrief`}>
              <FileText className="w-4 h-4 mr-2" />
              Create Debrief
            </Link>
          </Button>
        )}

        {canComplete && (
          <Button 
            variant="default" 
            className="w-full justify-start"
            onClick={handleCompleteMission}
            disabled={completing}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {completing ? "Completing..." : "Complete Mission"}
          </Button>
        )}

        {canEdit && (
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href={`/instructor/missions/${mission.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Mission
            </Link>
          </Button>
        )}

        {canCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full justify-start">
                <X className="w-4 h-4 mr-2" />
                Cancel Mission
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Mission?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Please provide a reason for cancellation.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                placeholder="Reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Mission</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleCancelMission}
                  disabled={cancelling || !cancellationReason.trim()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {cancelling ? "Cancelling..." : "Cancel Mission"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <Button variant="outline" className="w-full justify-start" asChild>
          <Link href="/instructor/schedule">
            <Calendar className="w-4 h-4 mr-2" />
            View Schedule
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

