import { Suspense } from "react"
import { SeedUserPermissions } from "./seed-user-permissions"
import { SeedUserPermissionsSkeleton } from "./seed-user-permissions-skeleton"

export default function SeedUserPermissionsPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seed User Permissions</h1>
        <p className="text-muted-foreground">Initialize default permissions for existing users based on their roles.</p>
      </div>

      <Suspense fallback={<SeedUserPermissionsSkeleton />}>
        <SeedUserPermissions />
      </Suspense>
    </div>
  )
}
