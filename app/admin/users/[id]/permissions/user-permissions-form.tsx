"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserPermissions, updateUserPermissions } from "@/lib/user-service"

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface PermissionCategory {
  name: string
  permissions: Permission[]
}

interface UserPermissionsFormProps {
  userId: string
  userName: string
  userRole: "admin" | "instructor" | "student"
}

// Define available permissions based on role
const getAvailablePermissions = (role: "admin" | "instructor" | "student"): PermissionCategory[] => {
  const adminPermissions: PermissionCategory[] = [
    {
      name: "User Management",
      permissions: [
        { id: "users.view", name: "View Users", description: "Can view user details", category: "User Management" },
        { id: "users.create", name: "Create Users", description: "Can create new users", category: "User Management" },
        { id: "users.edit", name: "Edit Users", description: "Can edit user details", category: "User Management" },
        { id: "users.delete", name: "Delete Users", description: "Can delete users", category: "User Management" },
      ],
    },
    {
      name: "Aircraft Management",
      permissions: [
        {
          id: "aircraft.view",
          name: "View Aircraft",
          description: "Can view aircraft details",
          category: "Aircraft Management",
        },
        {
          id: "aircraft.create",
          name: "Create Aircraft",
          description: "Can add new aircraft",
          category: "Aircraft Management",
        },
        {
          id: "aircraft.edit",
          name: "Edit Aircraft",
          description: "Can edit aircraft details",
          category: "Aircraft Management",
        },
        {
          id: "aircraft.delete",
          name: "Delete Aircraft",
          description: "Can delete aircraft",
          category: "Aircraft Management",
        },
      ],
    },
    {
      name: "Syllabus Management",
      permissions: [
        { id: "syllabi.view", name: "View Syllabi", description: "Can view syllabi", category: "Syllabus Management" },
        {
          id: "syllabi.create",
          name: "Create Syllabi",
          description: "Can create new syllabi",
          category: "Syllabus Management",
        },
        { id: "syllabi.edit", name: "Edit Syllabi", description: "Can edit syllabi", category: "Syllabus Management" },
        {
          id: "syllabi.delete",
          name: "Delete Syllabi",
          description: "Can delete syllabi",
          category: "Syllabus Management",
        },
      ],
    },
    {
      name: "Enrollment Management",
      permissions: [
        {
          id: "enrollments.view",
          name: "View Enrollments",
          description: "Can view enrollments",
          category: "Enrollment Management",
        },
        {
          id: "enrollments.create",
          name: "Create Enrollments",
          description: "Can create new enrollments",
          category: "Enrollment Management",
        },
        {
          id: "enrollments.edit",
          name: "Edit Enrollments",
          description: "Can edit enrollments",
          category: "Enrollment Management",
        },
        {
          id: "enrollments.delete",
          name: "Delete Enrollments",
          description: "Can delete enrollments",
          category: "Enrollment Management",
        },
      ],
    },
    {
      name: "Schedule Management",
      permissions: [
        {
          id: "schedule.view",
          name: "View Schedule",
          description: "Can view all schedules",
          category: "Schedule Management",
        },
        {
          id: "schedule.create",
          name: "Create Sessions",
          description: "Can create flight sessions",
          category: "Schedule Management",
        },
        {
          id: "schedule.edit",
          name: "Edit Sessions",
          description: "Can edit flight sessions",
          category: "Schedule Management",
        },
        {
          id: "schedule.delete",
          name: "Delete Sessions",
          description: "Can delete flight sessions",
          category: "Schedule Management",
        },
      ],
    },
    {
      name: "Document Management",
      permissions: [
        {
          id: "documents.view",
          name: "View Documents",
          description: "Can view all documents",
          category: "Document Management",
        },
        {
          id: "documents.create",
          name: "Create Documents",
          description: "Can upload documents",
          category: "Document Management",
        },
        {
          id: "documents.verify",
          name: "Verify Documents",
          description: "Can verify documents",
          category: "Document Management",
        },
        {
          id: "documents.delete",
          name: "Delete Documents",
          description: "Can delete documents",
          category: "Document Management",
        },
      ],
    },
    {
      name: "Reports",
      permissions: [
        { id: "reports.view", name: "View Reports", description: "Can view all reports", category: "Reports" },
        { id: "reports.export", name: "Export Reports", description: "Can export reports", category: "Reports" },
      ],
    },
    {
      name: "System",
      permissions: [
        {
          id: "system.settings",
          name: "System Settings",
          description: "Can modify system settings",
          category: "System",
        },
        { id: "system.logs", name: "View Logs", description: "Can view system logs", category: "System" },
      ],
    },
  ]

  const instructorPermissions: PermissionCategory[] = [
    {
      name: "Student Management",
      permissions: [
        {
          id: "students.view",
          name: "View Students",
          description: "Can view assigned students",
          category: "Student Management",
        },
        {
          id: "students.progress",
          name: "Update Progress",
          description: "Can update student progress",
          category: "Student Management",
        },
      ],
    },
    {
      name: "Schedule Management",
      permissions: [
        {
          id: "schedule.view_own",
          name: "View Own Schedule",
          description: "Can view own schedule",
          category: "Schedule Management",
        },
        {
          id: "schedule.create_own",
          name: "Create Own Sessions",
          description: "Can create own flight sessions",
          category: "Schedule Management",
        },
        {
          id: "schedule.edit_own",
          name: "Edit Own Sessions",
          description: "Can edit own flight sessions",
          category: "Schedule Management",
        },
      ],
    },
    {
      name: "Document Management",
      permissions: [
        {
          id: "documents.view_own",
          name: "View Own Documents",
          description: "Can view own documents",
          category: "Document Management",
        },
        {
          id: "documents.upload",
          name: "Upload Documents",
          description: "Can upload own documents",
          category: "Document Management",
        },
        {
          id: "documents.verify_student",
          name: "Verify Student Documents",
          description: "Can verify student documents",
          category: "Document Management",
        },
      ],
    },
    {
      name: "Reports",
      permissions: [
        { id: "reports.view_own", name: "View Own Reports", description: "Can view own reports", category: "Reports" },
        {
          id: "reports.export_own",
          name: "Export Own Reports",
          description: "Can export own reports",
          category: "Reports",
        },
      ],
    },
  ]

  const studentPermissions: PermissionCategory[] = [
    {
      name: "Schedule",
      permissions: [
        {
          id: "schedule.view_own",
          name: "View Own Schedule",
          description: "Can view own schedule",
          category: "Schedule",
        },
        {
          id: "schedule.request",
          name: "Request Sessions",
          description: "Can request flight sessions",
          category: "Schedule",
        },
      ],
    },
    {
      name: "Documents",
      permissions: [
        {
          id: "documents.view_own",
          name: "View Own Documents",
          description: "Can view own documents",
          category: "Documents",
        },
        {
          id: "documents.upload",
          name: "Upload Documents",
          description: "Can upload own documents",
          category: "Documents",
        },
      ],
    },
    {
      name: "Progress",
      permissions: [
        { id: "progress.view", name: "View Progress", description: "Can view own progress", category: "Progress" },
        {
          id: "progress.export",
          name: "Export Progress",
          description: "Can export own progress reports",
          category: "Progress",
        },
      ],
    },
  ]

  switch (role) {
    case "admin":
      return adminPermissions
    case "instructor":
      return instructorPermissions
    case "student":
      return studentPermissions
    default:
      return []
  }
}

export function UserPermissionsForm({ userId, userName, userRole }: UserPermissionsFormProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const availablePermissions = getAvailablePermissions(userRole)

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const permissions = await getUserPermissions(userId)
        setSelectedPermissions(permissions)
      } catch (err) {
        setError("Failed to load user permissions")
      } finally {
        setIsLoading(false)
      }
    }

    loadPermissions()
  }, [userId])

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permissionId])
    } else {
      setSelectedPermissions(selectedPermissions.filter((id) => id !== permissionId))
    }
  }

  const handleSelectAllInCategory = (category: string, checked: boolean) => {
    const categoryPermissions =
      availablePermissions.find((cat) => cat.name === category)?.permissions.map((p) => p.id) || []

    if (checked) {
      // Add all permissions in this category that aren't already selected
      const newPermissions = [...selectedPermissions]
      categoryPermissions.forEach((id) => {
        if (!newPermissions.includes(id)) {
          newPermissions.push(id)
        }
      })
      setSelectedPermissions(newPermissions)
    } else {
      // Remove all permissions in this category
      setSelectedPermissions(selectedPermissions.filter((id) => !categoryPermissions.includes(id)))
    }
  }

  const isCategoryFullySelected = (category: string) => {
    const categoryPermissions =
      availablePermissions.find((cat) => cat.name === category)?.permissions.map((p) => p.id) || []

    return categoryPermissions.every((id) => selectedPermissions.includes(id))
  }

  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions =
      availablePermissions.find((cat) => cat.name === category)?.permissions.map((p) => p.id) || []

    return (
      categoryPermissions.some((id) => selectedPermissions.includes(id)) &&
      !categoryPermissions.every((id) => selectedPermissions.includes(id))
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await updateUserPermissions(userId, selectedPermissions)

      if (result.success) {
        router.push(`/admin/users/${userId}`)
        router.refresh()
      } else {
        setError(result.error || "Failed to update permissions")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Permissions</CardTitle>
          <CardDescription>Please wait while we load the user permissions...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions for {userName}</CardTitle>
        <CardDescription>
          Configure what this user can access and modify in the system. Role-based permissions for {userRole}s.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {availablePermissions.map((category) => (
          <div key={category.name} className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.name}`}
                checked={isCategoryFullySelected(category.name)}
                indeterminate={isCategoryPartiallySelected(category.name)}
                onCheckedChange={(checked) => handleSelectAllInCategory(category.name, checked === true)}
              />
              <label htmlFor={`category-${category.name}`} className="text-lg font-semibold">
                {category.name}
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
              {category.permissions.map((permission) => (
                <div key={permission.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={permission.id}
                    checked={selectedPermissions.includes(permission.id)}
                    onCheckedChange={(checked) => handlePermissionChange(permission.id, checked === true)}
                  />
                  <div className="grid gap-1">
                    <label
                      htmlFor={permission.id}
                      className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {permission.name}
                    </label>
                    <p className="text-sm text-muted-foreground">{permission.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/users/${userId}`)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Permissions
        </Button>
      </CardFooter>
    </Card>
  )
}
