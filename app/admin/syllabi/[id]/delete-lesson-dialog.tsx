"use client"

import { useState } from "react"
import { type SyllabusLesson, deleteSyllabusLesson } from "@/lib/syllabus-service"
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
import { useToast } from "@/hooks/use-toast"

interface DeleteLessonDialogProps {
  lesson: SyllabusLesson | null
  syllabusId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteLessonDialog({ lesson, syllabusId, open, onOpenChange }: DeleteLessonDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  if (!lesson) return null

  async function handleDelete() {
    if (!lesson) return

    setIsDeleting(true)
    try {
      const result = await deleteSyllabusLesson(lesson.id, syllabusId)

      if (result.success) {
        toast({
          title: "Lesson deleted",
          description: `${lesson.title} has been successfully deleted.`,
        })
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete lesson. Please try again.",
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
          <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{lesson.title}&quot;? This action cannot be undone.
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
