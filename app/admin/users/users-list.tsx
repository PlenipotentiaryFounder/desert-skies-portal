"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { MoreHorizontal, Pencil, Trash2, UserPlus, Shield, CheckCircle, XCircle, Clock } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  filterUsersByRole,
  filterUsersByStatus,
  searchUsers,
  getUsers,
  updateUserStatus,
  type User,
} from "@/lib/user-service"
import { DeleteUserDialog } from "./delete-user-dialog"
import { BulkActions } from "./bulk-actions"

interface UsersListProps {
  initialQuery: string
  initialRole: "admin" | "instructor" | "student" | "all"
  initialStatus: "active" | "inactive" | "pending" | "all"
}

export function UsersList({ initialQuery, initialRole, initialStatus }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [role, setRole] = useState<"admin" | "instructor" | "student" | "all">(initialRole)
  const [status, setStatus] = useState<"active" | "inactive" | "pending" | "all">(initialStatus)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function loadUsers() {
      setLoading(true)
      let fetchedUsers: User[] = []

      if (searchQuery) {
        fetchedUsers = await searchUsers(searchQuery)
      } else if (role !== "all") {
        fetchedUsers = await filterUsersByRole(role)
      } else if (status !== "all") {
        fetchedUsers = await filterUsersByStatus(status)
      } else {
        fetchedUsers = await getUsers()
      }

      // Apply additional filters if needed
      if (role !== "all" && searchQuery) {
        fetchedUsers = fetchedUsers.filter((user) => user.role === role)
      }

      if (status !== "all" && (searchQuery || role !== "all")) {
        fetchedUsers = fetchedUsers.filter((user) => user.status === status)
      }

      setUsers(fetchedUsers)
      setLoading(false)
    }

    loadUsers()
  }, [searchQuery, role, status])

  useEffect(() => {
    // Update URL with search params
    const params = new URLSearchParams(searchParams)

    if (searchQuery) {
      params.set("q", searchQuery)
    } else {
      params.delete("q")
    }

    if (role !== "all") {
      params.set("role", role)
    } else {
      params.delete("role")
    }

    if (status !== "all") {
      params.set("status", status)
    } else {
      params.delete("status")
    }

    router.replace(`${pathname}?${params.toString()}`)
  }, [searchQuery, role, status, pathname, router, searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const query = formData.get("query") as string
    setSearchQuery(query)
  }

  const handleRoleChange = (value: string) => {
    setRole(value as "admin" | "instructor" | "student" | "all")
  }

  const handleStatusChange = (value: string) => {
    setStatus(value as "active" | "inactive" | "pending" | "all")
  }

  const handleStatusUpdate = async (userId: string, newStatus: "active" | "inactive" | "pending") => {
    const result = await updateUserStatus(userId, newStatus)
    if (result.success) {
      setUsers(users.map((user) => (user.id === userId ? { ...user, status: newStatus } : user)))
    }
  }

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteComplete = (success: boolean) => {
    setIsDeleteDialogOpen(false)
    if (success && userToDelete) {
      setUsers(users.filter((user) => user.id !== userToDelete))
    }
    setUserToDelete(null)
  }

  const handleUserSelection = (userId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    }
  }

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedUsers(users.map((user) => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleBulkActionComplete = () => {
    setSelectedUsers([])
    router.refresh()
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Admin</Badge>
      case "instructor":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Instructor</Badge>
      case "student":
        return <Badge className="bg-green-500 hover:bg-green-600">Student</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "inactive":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Manage users and their permissions in the Desert Skies Aviation Training Portal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
              <Input
                name="query"
                placeholder="Search users..."
                className="w-full sm:w-[300px]"
                defaultValue={searchQuery}
              />
              <Button type="submit">Search</Button>
            </form>
            <div className="flex gap-2">
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedUsers.length > 0 && (
            <div className="my-2">
              <BulkActions selectedUsers={selectedUsers} onActionComplete={handleBulkActionComplete} />
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={users.length > 0 && selectedUsers.length === users.length}
                      {...(selectedUsers.length > 0 && selectedUsers.length < users.length ? { indeterminate: true } : {})}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all users"
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No users found. Try adjusting your search or filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-accent/40 focus:bg-accent/60 transition-colors"
                      onClick={e => {
                        // Prevent row click if clicking on a button, link, or input
                        if (
                          (e.target as HTMLElement).closest('button, a, input, [role="menuitem"]')
                        ) {
                          return
                        }
                        router.push(`/admin/users/${user.id}`)
                      }}
                      tabIndex={0}
                      role="link"
                      aria-label={`View details for ${user.first_name} ${user.last_name}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleUserSelection(user.id, checked === true)}
                          aria-label={`Select ${user.first_name} ${user.last_name}`}
                          onClick={e => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(user.first_name, user.last_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.phone || "No phone"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(user.status)}
                          <span className="capitalize">{user.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}`} onClick={e => e.stopPropagation()}>
                                <div className="flex items-center">
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </div>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}/permissions`} onClick={e => e.stopPropagation()}>
                                <div className="flex items-center">
                                  <Shield className="mr-2 h-4 w-4" />
                                  Permissions
                                </div>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={e => { e.stopPropagation(); handleStatusUpdate(user.id, "active") }}
                              disabled={user.status === "active"}
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                              Set Active
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={e => { e.stopPropagation(); handleStatusUpdate(user.id, "inactive") }}
                              disabled={user.status === "inactive"}
                            >
                              <XCircle className="mr-2 h-4 w-4 text-red-500" />
                              Set Inactive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={e => { e.stopPropagation(); handleDeleteClick(user.id) }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">{users.length} users found</div>
        <Button asChild>
          <Link href="/admin/users/new">
            <div className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </div>
          </Link>
        </Button>
      </CardFooter>

      <DeleteUserDialog isOpen={isDeleteDialogOpen} userId={userToDelete || ""} onComplete={handleDeleteComplete} />
    </Card>
  )
}
