"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserPermissions, updateUserPermissions } from "@/lib/user-service"
import { Badge } from "@/components/ui/badge"

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

// Gather all unique permissions across all roles
const ALL_ROLE_PERMISSIONS = [
  ...getAvailablePermissions("admin"),
  ...getAvailablePermissions("instructor"),
  ...getAvailablePermissions("student"),
]

// Flatten and deduplicate permissions by id
const ALL_PERMISSIONS_MAP = new Map<string, Permission>()
ALL_ROLE_PERMISSIONS.forEach(cat => {
  cat.permissions.forEach(perm => {
    if (!ALL_PERMISSIONS_MAP.has(perm.id)) {
      ALL_PERMISSIONS_MAP.set(perm.id, perm)
    }
  })
})
const ALL_PERMISSIONS = Array.from(ALL_PERMISSIONS_MAP.values())

// Map of default permissions for each role
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: getAvailablePermissions("admin").flatMap(cat => cat.permissions.map(p => p.id)),
  instructor: getAvailablePermissions("instructor").flatMap(cat => cat.permissions.map(p => p.id)),
  student: getAvailablePermissions("student").flatMap(cat => cat.permissions.map(p => p.id)),
}

export function UserPermissionsForm({ userId, userName, userRole }: UserPermissionsFormProps) {
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setLoading(true)
    getUserPermissions(userId)
      .then(perms => setPermissions(perms))
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false))
  }, [userId])

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setPermissions(prev =>
      checked ? [...prev, permissionId] : prev.filter(p => p !== permissionId)
    )
    setSuccess(null)
    setError(null)
  }

  const handleResetToDefault = () => {
    setPermissions(DEFAULT_ROLE_PERMISSIONS[userRole] || [])
    setSuccess(null)
    setError(null)
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await updateUserPermissions(userId, permissions)
      if (result.success) {
        setSuccess("Permissions updated successfully.")
        router.push(`/admin/users/${userId}`)
        router.refresh()
      } else {
        setError(result.error || "Failed to update permissions.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to update permissions.")
    } finally {
      setIsSaving(false)
    }
  }

  // Group all permissions by category for display
  const categories: Record<string, Permission[]> = {}
  ALL_PERMISSIONS.forEach(perm => {
    if (!categories[perm.category]) categories[perm.category] = []
    categories[perm.category].push(perm)
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions for {userName}</CardTitle>
        <CardDescription>
          Toggle permissions for this user. Default permissions for the <Badge>{userRole}</Badge> role are highlighted.
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
        {success && (
          <Alert variant="success">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {loading ? (
          <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Loading permissions...</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(categories).map(([category, perms]) => (
              <div key={category} className="border rounded-md p-4">
                <div className="font-semibold mb-2">{category}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {perms.map(perm => {
                    const isDefault = (DEFAULT_ROLE_PERMISSIONS[userRole] || []).includes(perm.id)
                    return (
                      <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={permissions.includes(perm.id)}
                          onCheckedChange={checked => handlePermissionChange(perm.id, checked === true)}
                        />
                        <span>{perm.name}</span>
                        {isDefault && <Badge variant="outline" className="ml-2">default</Badge>}
                        <span className="text-muted-foreground text-xs ml-2">{perm.description}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col md:flex-row gap-2 md:gap-4 justify-between items-center">
        <Button type="button" variant="outline" onClick={handleResetToDefault} disabled={loading || isSaving}>
          Reset to {userRole} defaults
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={loading || isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Permissions
        </Button>
      </CardFooter>
    </Card>
  )
}
