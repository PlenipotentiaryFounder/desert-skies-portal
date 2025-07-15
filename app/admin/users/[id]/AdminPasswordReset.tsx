"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AdminPasswordReset({ user }: { user: any }) {
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetPassword, setResetPassword] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState("")
  const [resetSuccess, setResetSuccess] = useState("")

  const handleResetPassword = async () => {
    setResetLoading(true)
    setResetError("")
    setResetSuccess("")
    try {
      const res = await fetch(`/api/admin/users/${user?.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to reset password")
      setResetSuccess("Password reset successfully.")
      setResetPassword("")
    } catch (err: any) {
      setResetError(err.message)
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div>
      <Button variant="outline" type="button" onClick={() => setShowResetDialog(true)}>
        Reset Password
      </Button>
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
          </DialogHeader>
          {resetSuccess && (
            <Alert variant="success">
              <AlertDescription>{resetSuccess}</AlertDescription>
            </Alert>
          )}
          {resetError && (
            <Alert variant="destructive">
              <AlertDescription>{resetError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="reset-password">New Password</Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              value={resetPassword}
              onChange={e => setResetPassword(e.target.value)}
              minLength={6}
              placeholder="Enter new password"
              disabled={resetLoading}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleResetPassword}
              disabled={resetLoading || resetPassword.length < 6}
            >
              {resetLoading ? "Resetting..." : "Reset Password"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 