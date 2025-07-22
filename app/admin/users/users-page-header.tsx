import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function UsersPageHeader() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage users and their permissions in the Desert Skies Aviation Training Portal.
        </p>
      </div>
      <Button asChild>
        <Link href="/admin/users/new">
          <div className="flex items-center">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </div>
        </Link>
      </Button>
    </div>
  )
}
