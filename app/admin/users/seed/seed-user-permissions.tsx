"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getUsers, updateUserPermissions } from "@/lib/user-service"

export async function SeedUserPermissions() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const router = useRouter()

  const users = await getUsers()

  const handleSeedPermissions = async () => {
    setIsSeeding(true)
    setResult(null)

    try {
      // Process each user and assign default permissions based on role
      for (const user of users) {
        let permissions: string[] = []

        if (user.role === "admin") {
          permissions = [
            // User Management
            "users.view",
            "users.create",
            "users.edit",
            "users.delete",
            // Aircraft Management
            "aircraft.view",
            "aircraft.create",
            "aircraft.edit",
            "aircraft.delete",
            // Syllabus Management
            "syllabi.view",
            "syllabi.create",
            "syllabi.edit",
            "syllabi.delete",
            // Enrollment Management
            "enrollments.view",
            "enrollments.create",
            "enrollments.edit",
            "enrollments.delete",
            // Schedule Management
            "schedule.view",
            "schedule.create",
            "schedule.edit",
            "schedule.delete",
            // Document Management
            "documents.view",
            "documents.create",
            "documents.verify",
            "documents.delete",
            // Reports
            "reports.view",
            "reports.export",
            // System
            "system.settings",
            "system.logs",
          ]
        } else if (user.role === "instructor") {
          permissions = [
            // Student Management
            "students.view",
            "students.progress",
            // Schedule Management
            "schedule.view_own",
            "schedule.create_own",
            "schedule.edit_own",
            // Document Management
            "documents.view_own",
            "documents.upload",
            "documents.verify_student",
            // Reports
            "reports.view_own",
            "reports.export_own",
          ]
        } else if (user.role === "student") {
          permissions = [
            // Schedule
            "schedule.view_own",
            "schedule.request",
            // Documents
            "documents.view_own",
            "documents.upload",
            // Progress
            "progress.view",
            "progress.export",
          ]
        }

        // Update user permissions
        await updateUserPermissions(user.id, permissions)
      }

      setResult({
        success: true,
        message: `Successfully seeded permissions for ${users.length} users.`,
      })
      router.refresh()
    } catch (error) {
      setResult({
        success: false,
        message: "An error occurred while seeding permissions.",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seed User Permissions</CardTitle>
        <CardDescription>
          This will assign default permissions to all users based on their roles. Existing custom permissions will be
          overwritten.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>Found {users.length} users in the system:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{users.filter((u) => u.role === "admin").length} administrators</li>
            <li>{users.filter((u) => u.role === "instructor").length} instructors</li>
            <li>{users.filter((u) => u.role === "student").length} students</li>
          </ul>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/admin/users")}>
          Back to Users
        </Button>
        <Button onClick={handleSeedPermissions} disabled={isSeeding}>
          {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Seed Permissions
        </Button>
      </CardFooter>
    </Card>
  )
}
