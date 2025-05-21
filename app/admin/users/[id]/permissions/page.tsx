import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getUserById } from "@/lib/user-service"
import { UserPermissionsForm } from "./user-permissions-form"

interface UserPermissionsPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: UserPermissionsPageProps): Promise<Metadata> {
  const user = await getUserById(params.id)

  if (!user) {
    return {
      title: "User Not Found | Desert Skies Aviation",
    }
  }

  return {
    title: `${user.first_name} ${user.last_name} Permissions | Desert Skies Aviation`,
    description: `Manage permissions for ${user.first_name} ${user.last_name}`,
  }
}

export default async function UserPermissionsPage({ params }: UserPermissionsPageProps) {
  const user = await getUserById(params.id)

  if (!user) {
    notFound()
  }

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Permissions</h1>
        <p className="text-muted-foreground">
          Manage permissions for {user.first_name} {user.last_name}
        </p>
      </div>

      <UserPermissionsForm userId={user.id} userName={`${user.first_name} ${user.last_name}`} userRole={user.role} />
    </div>
  )
}
