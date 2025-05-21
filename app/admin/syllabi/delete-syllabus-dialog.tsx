"use client"

import { useState } from "react"
import { type Syllabus, deleteSyllabus } from "@/lib/syllabus-service"
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

interface DeleteSyllabusDialogProps {
  syllabus: Syllabus | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteSyllabusDialog({ syllabus, open, onOpenChange }: DeleteSyllabusDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  if (!syllabus) return null

  async function handleDelete() {
    if (!syllabus) return

    setIsDeleting(true)
    try {
      const result = await deleteSyllabus(syllabus.id)

      if (result.success) {
        toast({
          title: "Syllabus deleted",
          description: `${syllabus.title} has been successfully deleted.`,
        })
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete syllabus. Please try again.",
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
          <AlertDialogTitle>Delete Syllabus</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{syllabus.title}&quot;? This action cannot be undone and will also
            delete all lessons associated with this syllabus.
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
