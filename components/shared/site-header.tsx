import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getUserProfileWithRoles } from "@/lib/user-service"
import { Icons } from "@/components/ui/icons"
import { UserNav } from "@/components/shared/user-nav"

export async function SiteHeader() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    profile = await getUserProfileWithRoles(user.id)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="inline-block font-bold">Desert Skies</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <UserNav profile={profile} />
          </nav>
        </div>
      </div>
    </header>
  )
} 