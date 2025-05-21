import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getUserById } from "@/lib/user-service"
import { UserForm } from "../user-form"

interface UserDetailPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: UserDetailPageProps): Promise<Metadata> {
  const user = await getUserById(params.id)

  if (!user) {
    return {
      title: "User Not Found | Desert Skies Aviation",
    }
  }

  return {
    title: `Edit ${user.first_name} ${user.last_name} | Desert Skies Aviation`,
    description: `Edit user details for ${user.first_name} ${user.last_name}`,
  }
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const user = await getUserById(params.id)

  if (!user) {
    notFound()
  }

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
        <p className="text-muted-foreground">
          Update details for {user.first_name} {user.last_name}
        </p>
      </div>

      <UserForm user={user} />
    </div>
  )
}
