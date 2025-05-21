"use client"

import { useState } from "react"
import { deleteFlightSession, type FlightSession } from "@/lib/flight-session-service"
import { formatDate, formatTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"

interface DeleteFlightSessionDialogProps {
  session: FlightSession
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: string) => void
}

export function DeleteFlightSessionDialog({ session, open, onOpenChange, onDelete }: DeleteFlightSessionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteFlightSession(session.id)
      if (result.success) {
        toast({
          title: "Flight session deleted",
          description: "The flight session has been successfully deleted.",
        })
        onDelete(session.id)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete flight session. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Flight Session</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this flight session? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4">
            <div className="grid gap-2">
              <div className="font-medium">
                {formatDate(session.date)} at {formatTime(session.start_time)}
              </div>
              <div className="text-sm text-muted-foreground">
                Student: {session.student?.first_name} {session.student?.last_name}
              </div>
              <div className="text-sm text-muted-foreground">
                Instructor: {session.instructor?.first_name} {session.instructor?.last_name}
              </div>
              <div className="text-sm text-muted-foreground">Aircraft: {session.aircraft?.tail_number}</div>
              <div className="text-sm text-muted-foreground">Lesson: {session.lesson?.title}</div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Flight Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
