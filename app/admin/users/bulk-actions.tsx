"use client"

import { useState } from "react"
import { Loader2, CheckCircle, XCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { updateUserStatus, deleteUser } from "@/lib/user-service"

interface BulkActionsProps {
  selectedUsers: string[]
  onActionComplete: () => void
}

export function BulkActions({ selectedUsers, onActionComplete }: BulkActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleStatusUpdate = async (status: "active" | "inactive" | "pending") => {
    if (selectedUsers.length === 0) return

    setIsProcessing(true)
    try {
      for (const userId of selectedUsers) {
        await updateUserStatus(userId, status)
      }
      onActionComplete()
    } catch (error) {
      console.error("Error updating user status:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (selectedUsers.length === 0) return

    setIsProcessing(true)
    try {
      for (const userId of selectedUsers) {
        await deleteUser(userId)
      }
      setShowDeleteDialog(false)
      onActionComplete()
    } catch (error) {
      console.error("Error deleting users:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={selectedUsers.length === 0 || isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Bulk Actions ({selectedUsers.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleStatusUpdate("active")}>
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Set Active
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusUpdate("inactive")}>
            <XCircle className="mr-2 h-4 w-4 text-red-500" />
            Set Inactive
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 focus:text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected users and remove their data from
              the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isProcessing} className="bg-red-600 hover:bg-red-700">
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
