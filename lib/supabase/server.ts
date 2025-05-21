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
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user ?? null
}

export async function getUserRole() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  const { data } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()
  return data?.role
}

export async function hasAdditionalRole(role: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return false
  }

  const { data } = await supabase.from("profiles").select("metadata").eq("id", session.user.id).single()

  if (!data || !data.metadata) {
    return false
  }

  const metadata = data.metadata as { additional_roles?: string[] }
  return !!metadata?.additional_roles?.includes(role)
}
