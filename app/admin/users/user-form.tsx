"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { createUser, updateUser, type User, updateUserRole, updateUserPermissions, getUserById } from "@/lib/user-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const userFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  first_name: z.string().min(1, { message: "First name is required" }),
  last_name: z.string().min(1, { message: "Last name is required" }),
  role: z.enum(["admin", "instructor", "student"], {
    required_error: "Please select a role",
  }),
  phone: z.string().optional(),
  bio: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"], {
    required_error: "Please select a status",
  }),
  password: z.string().optional(),
})

type UserFormValues = z.infer<typeof userFormSchema>

interface UserFormProps {
  user?: User
  hidePasswordReset?: boolean
}

// Define default permissions for each role
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["manage_users", "view_reports", "edit_settings"],
  instructor: ["view_students", "edit_lessons", "grade_sessions"],
  student: ["view_lessons", "submit_assignments", "view_progress"],
}

export function UserForm({ user, hidePasswordReset = false }: UserFormProps & { hidePasswordReset?: boolean }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetPassword, setResetPassword] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState("")
  const [resetSuccess, setResetSuccess] = useState("")
  const { toast } = useToast()

  const defaultValues: Partial<UserFormValues> = user
    ? {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || "",
        bio: user.bio || "",
        status: user.status || "active",
      }
    : {
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        bio: "",
        status: "active",
        password: "",
      }

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  })

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      if (user) {
        // Update existing user profile fields
        const result = await updateUser(user.id, data)

        if (!result.success) {
          setError(result.error || "Failed to update user")
          setIsSubmitting(false)
          return
        }

        // If the role changed, update user_roles table
        // (Assume updateUserRole now updates user_roles, not profiles.role)
        if (user.roles && !user.roles.includes(data.role)) {
          const roleResult = await updateUserRole(user.id, data.role)
          if (!roleResult.success) {
            setError(roleResult.error || "Failed to update user role")
            setIsSubmitting(false)
            return
          }
          // Update permissions to match new role
          const perms = DEFAULT_ROLE_PERMISSIONS[data.role] || []
          const permResult = await updateUserPermissions(user.id, perms)
          if (!permResult.success) {
            setError(permResult.error || "Failed to update user permissions")
            setIsSubmitting(false)
            return
          }
        }

        // Fetch latest user data and reset form so role dropdown is correct
        const latestUser = await getUserById(user.id)
        if (latestUser) {
          form.reset({
            email: latestUser.email,
            first_name: latestUser.first_name,
            last_name: latestUser.last_name,
            phone: latestUser.phone || "",
            bio: latestUser.bio || "",
            status: latestUser.status || "active",
          })
        }
        toast({ title: "User updated successfully" })
      } else {
        // Create new user
        const result = await createUser(data)

        if (result.success) {
          toast({ title: "User created successfully" })
        } else {
          setError(result.error || "Failed to create user")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

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
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} disabled={!!user} />
                  </FormControl>
                  {user && <FormDescription>Email cannot be changed after user creation.</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />

            {!user && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" placeholder="Enter password (optional)" {...field} />
                    </FormControl>
                    <FormDescription>
                      Leave blank to generate a random password. The user will need to reset their password.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormDescription>Optional contact phone number.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Controls whether the user can log in to the system.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description about the user..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormDescription>Optional biographical information about the user.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/users")} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {user ? "Update User" : "Create User"}
            </Button>
          </CardFooter>
        </form>
      </Form>
      {user && !hidePasswordReset && (
        <div className="mt-8">
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
      )}
    </Card>
  )
}
