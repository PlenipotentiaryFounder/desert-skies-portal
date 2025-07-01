import { Suspense } from "react"
import type { Metadata } from "next"
import { UsersList } from "./users-list"
import { UsersPageHeader } from "./users-page-header"
import { UserListSkeleton } from "./user-list-skeleton"

export const metadata: Metadata = {
  title: "User Management | Desert Skies Aviation",
  description: "Manage users and permissions for Desert Skies Aviation Training Portal",
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string; status?: string }
}) {
  const awaitedSearchParams = await searchParams
  const query = awaitedSearchParams.q || ""
  const role = (awaitedSearchParams.role as "admin" | "instructor" | "student" | "all") || "all"
  const status = (awaitedSearchParams.status as "active" | "inactive" | "pending" | "all") || "all"

  return (
    <div className="flex flex-col space-y-6">
      <UsersPageHeader />

      <Suspense fallback={<UserListSkeleton />}>
        <UsersList initialQuery={query} initialRole={role} initialStatus={status} />
      </Suspense>
    </div>
  )
}
