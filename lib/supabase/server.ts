import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// Always await this function! It returns a Promise for a Supabase client instance.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

// Server-side best practice: There is no getUser() on the server helper, only getSession().
// This helper wraps getSession() and returns the user object (or null) for use everywhere in server components.
export async function getUserFromSession() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  
  return user
}

// Update getUserRole to use getUser()
export async function getUserRole() {
  const user = await getUserFromSession()

  if (!user) {
    return null
  }

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  return data?.role
}

// Update hasAdditionalRole to use getUser()
export async function hasAdditionalRole(role: string) {
  const user = await getUserFromSession()

  if (!user) {
    return false
  }

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from("profiles").select("metadata").eq("id", user.id).single()

  if (!data || !data.metadata) {
    return false
  }

  const metadata = data.metadata as { additional_roles?: string[] }
  return !!metadata?.additional_roles?.includes(role)
}
