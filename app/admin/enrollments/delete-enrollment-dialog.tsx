"use client"

import { useState } from "react"
import { type Enrollment, deleteEnrollment } from "@/lib/enrollment-service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

interface DeleteEnrollmentDialogProps {
  enrollment: Enrollment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteEnrollmentDialog({ enrollment, open, onOpenChange }: DeleteEnrollmentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  if (!enrollment) return null

  async function handleDelete() {
    if (!enrollment) return

    setIsDeleting(true)
    try {
      const result = await deleteEnrollment(enrollment.id)

      if (result.success) {
        toast({
          title: "Enrollment deleted",
          description: `The enrollment has been successfully deleted.`,
        })
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete enrollment. Please try again.",
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Enrollment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the enrollment for{" "}
            <strong>
              {enrollment.student?.first_name} {enrollment.student?.last_name}
            </strong>{" "}
            in <strong>{enrollment.syllabus?.title}</strong>? This action cannot be undone and will remove all
            associated flight sessions and progress data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
