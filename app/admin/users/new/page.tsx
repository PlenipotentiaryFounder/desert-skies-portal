import type { Metadata } from "next"
import { UserForm } from "../user-form"

export const metadata: Metadata = {
  title: "Add New User | Desert Skies Aviation",
  description: "Add a new user to the Desert Skies Aviation Training Portal",
}

export default function NewUserPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New User</h1>
        <p className="text-muted-foreground">Create a new user account in the Desert Skies Aviation Training Portal.</p>
      </div>

      <UserForm />
    </div>
  )
}
