"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database } from "@/types/supabase"
import { cookies } from "next/headers"

export type User = Database["public"]["Tables"]["profiles"]["Row"] & {
  roles?: string[]
  permissions?: string[]
  goals?: string
  initial_role?: string
}

export type NewUser = Database["public"]["Tables"]["profiles"]["Insert"] & {
  password?: string
  initial_role?: string
}

export async function getUsers(): Promise<User[]> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data as User[]
}

export async function getUserById(id: string): Promise<User | null> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single()
  if (error || !data) {
    return null
  }
  return data as User
}

export async function getStudents(): Promise<User[]> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  // This needs to be adapted based on how roles are stored. Assuming a join with user_roles
  const { data, error } = await supabase
    .from("profiles")
    .select("*, user_roles!inner(roles!inner(name))")
    .eq("user_roles.roles.name", "student")
    .order("created_at", { ascending: false })

  if (error || !Array.isArray(data)) {
    return []
  }
  return data as User[]
}

export async function getInstructors(): Promise<User[]> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data, error } = await supabase
    .from("profiles")
    .select("*, user_roles!inner(roles!inner(name))")
    .eq("user_roles.roles.name", "instructor")
    .order("created_at", { ascending: false })

  if (error || !Array.isArray(data)) {
    return []
  }
  return data as User[]
}

export async function getActiveInstructors(): Promise<User[]> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data, error } = await supabase
    .from("profiles")
    .select("*, user_roles!inner(roles!inner(name))")
    .eq("user_roles.roles.name", "instructor")
    .eq("status", "active")
    .order("created_at", { ascending: false })
  if (error || !Array.isArray(data)) {
    return []
  }
  return data as User[]
}

export async function getPendingInstructors(): Promise<User[]> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data, error } = await supabase
    .from("profiles")
    .select("*, user_roles!inner(roles!inner(name))")
    .eq("user_roles.roles.name", "instructor")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
  if (error || !Array.isArray(data)) {
    return []
  }
  return data as User[]
}

export async function createUser(userData: NewUser) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
  })

  if (authError) {
    throw new Error(authError.message)
  }

  const userId = authData.user.id

  const profileData: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: userId,
    email: userData.email,
    first_name: userData.first_name,
    last_name: userData.last_name,
    phone: userData.phone,
    bio: userData.bio,
    status: "pending", // Default status
  }

  const { error: profileError } = await supabase.from("profiles").insert(profileData)

  if (profileError) {
    throw new Error(profileError.message)
  }
  
  if (userData.initial_role) {
    // This assumes a `user_roles` table exists
    // You might need to fetch role_id from `roles` table first
  }


  revalidatePath("/admin/users")

  return { ...authData.user, ...userData }
}

export async function updateUser(id: string, userData: Partial<User>) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const updateData: Database["public"]["Tables"]["profiles"]["Update"] = {}
  if (userData.first_name) updateData.first_name = userData.first_name
  if (userData.last_name) updateData.last_name = userData.last_name
  if (userData.phone) updateData.phone = userData.phone
  if (userData.bio) updateData.bio = userData.bio
  if (userData.status) updateData.status = userData.status

  if (userData.goals || userData.initial_role) {
    const { data: user, error } = await supabase.from("profiles").select("metadata").eq("id", id).single()
    if (error) console.error("Error fetching user metadata", error)
    const metadata = (user?.metadata as any) || {}
    if (userData.goals) metadata.goals = userData.goals
    if (userData.initial_role) metadata.initial_role = userData.initial_role
    updateData.metadata = metadata
  }

  updateData.updated_at = new Date().toISOString()

  const { error } = await supabase.from("profiles").update(updateData).eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/admin/users/${id}`)
  revalidatePath("/admin/users")

  return { id, ...userData }
}

export async function deleteUser(id: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { error: profileError } = await supabase.from("profiles").delete().eq("id", id)
  if (profileError) {
    console.error("Error deleting user profile:", profileError)
    return { success: false, error: profileError.message }
  }
  const { error: authError } = await supabase.auth.admin.deleteUser(id)
  if (authError) {
    console.error("Error deleting auth user:", authError)
    return { success: false, error: authError.message }
  }
  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateUserStatus(id: string, status: "active" | "inactive" | "pending") {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const updateData: Database["public"]["Tables"]["profiles"]["Update"] = { status, updated_at: new Date().toISOString() }
  const { error } = await supabase.from("profiles").update(updateData).eq("id", id)
  if (error) {
    console.error("Error updating user status:", error)
    return { success: false, error: error.message }
  }
  revalidatePath(`/admin/users/${id}`)
  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateUserRole(id: string, roleName: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  try {
    const { data, error } = await supabase.rpc("update_user_role", {
      p_user_id: id,
      p_role_name: roleName,
    })

    if (error) {
      throw error
    }

    revalidatePath(`/admin/users/${id}`)
    revalidatePath("/admin/users")
    return { success: true, data }
  } catch (error) {
    console.error("Error updating user role:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getUserPermissions(id: string): Promise<string[]> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data, error } = await supabase.from("user_permissions").select("permission").eq("user_id", id)
  if (error || !Array.isArray(data)) {
    console.error("Error fetching user permissions:", error)
    return []
  }
  return data.map((p) => p.permission) as string[]
}

export async function updateUserPermissions(id: string, permissions: string[]) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { error: deleteError } = await supabase.from("user_permissions").delete().eq("user_id", id)
  if (deleteError) {
    console.error("Error deleting user permissions:", deleteError)
    return { success: false, error: deleteError.message }
  }
  if (permissions.length > 0) {
    const permissionsData: Database["public"]["Tables"]["user_permissions"]["Insert"][] = permissions.map((permission) => ({
      user_id: id,
      permission: permission,
    }))
    const { error: insertError } = await supabase.from("user_permissions").insert(permissionsData)
    if (insertError) {
      console.error("Error inserting user permissions:", insertError)
      return { success: false, error: insertError.message }
    }
  }
  revalidatePath(`/admin/users/${id}`)
  return { success: true }
}

export async function searchUsers(query: string): Promise<User[]> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data, error } = await supabase
    .from("profiles")
    .select()
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
    .order("created_at", { ascending: false })

  if (error || !Array.isArray(data)) {
    return []
  }
  return data as User[]
}

export async function filterUsersByRole(role: "admin" | "instructor" | "student" | "all"): Promise<User[]> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  let query = supabase.from("profiles").select("*, user_roles!inner(roles!inner(name))")
  if (role !== "all") {
    query = query.eq("user_roles.roles.name", role)
  }
  const { data, error } = await query.order("created_at", { ascending: false })

  if (error || !Array.isArray(data)) {
    return []
  }
  return data as User[]
}

export async function filterUsersByStatus(status: "active" | "inactive" | "pending" | "all"): Promise<User[]> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  let query = supabase.from("profiles").select("*")
  if (status !== "all") {
    query = query.eq("status", status)
  }
  const { data, error } = await query.order("created_at", { ascending: false })

  if (error || !Array.isArray(data)) {
    return []
  }
  return data as User[]
}

export async function getCurrentInstructor(): Promise<User | null> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  return getUserProfileWithRoles(session.user.id)
}

export async function getUserProfileWithRoles(userId: string): Promise<User | null> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: profile, error: profileError } = await supabase.from("profiles").select(`*`).eq("id", userId).single()

  if (profileError) {
    console.error("Error fetching user profile:", profileError)
    return null
  }

  const { data: rolesData, error: rolesError } = await supabase.rpc("get_user_roles", { p_user_id: userId })

  if (rolesError) {
    console.error("Error fetching user roles:", rolesError)
    // Return profile without roles if roles fetch fails
    return { ...profile, roles: [] } as User
  }

  const roles = rolesData.map((r: any) => r.role_name)

  return { ...profile, roles } as User
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) return null
  return data as User
}
