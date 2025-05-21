"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type User = {
  id: string
  created_at: string
  updated_at: string
  email: string
  first_name: string
  last_name: string
  role: "admin" | "instructor" | "student"
  avatar_url: string | null
  phone: string | null
  bio: string | null
  status: "active" | "inactive" | "pending"
  permissions?: string[]
  metadata?: {
    additional_roles?: string[]
  }
}

export type NewUser = {
  email: string
  first_name: string
  last_name: string
  role: "admin" | "instructor" | "student"
  phone?: string
  bio?: string
  status: "active" | "inactive" | "pending"
  password?: string
  metadata?: {
    additional_roles?: string[]
  }
}

export async function getUsers() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching users:", error)
    return []
  }

  return data as User[]
}

export async function getUserById(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching user:", error)
    return null
  }

  return data as User
}

export async function getStudents() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching students:", error)
    return []
  }

  return data as User[]
}

export async function getInstructors() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "instructor")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching instructors:", error)
    return []
  }

  return data as User[]
}

export async function getPendingInstructors() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "instructor")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching pending instructors:", error)
    return []
  }

  return data as User[]
}

export async function createUser(userData: NewUser) {
  const supabase = await createServerSupabaseClient()

  // First create the auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password || Math.random().toString(36).slice(-8), // Generate random password if not provided
    email_confirm: true,
  })

  if (authError) {
    console.error("Error creating auth user:", authError)
    return { success: false, error: authError.message }
  }

  // Then create the profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    email: userData.email,
    first_name: userData.first_name,
    last_name: userData.last_name,
    role: userData.role,
    phone: userData.phone || null,
    bio: userData.bio || null,
    status: userData.status || (userData.role === "instructor" ? "pending" : "active"),
    metadata: userData.metadata || null,
  })

  if (profileError) {
    console.error("Error creating user profile:", profileError)
    return { success: false, error: profileError.message }
  }

  revalidatePath("/admin/users")
  return { success: true, userId: authData.user.id }
}

export async function updateUser(id: string, userData: Partial<User>) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
      phone: userData.phone,
      bio: userData.bio,
      status: userData.status,
      metadata: userData.metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating user:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/users/${id}`)
  revalidatePath("/admin/users")
  return { success: true }
}

export async function deleteUser(id: string) {
  const supabase = await createServerSupabaseClient()

  // First delete the profile
  const { error: profileError } = await supabase.from("profiles").delete().eq("id", id)

  if (profileError) {
    console.error("Error deleting user profile:", profileError)
    return { success: false, error: profileError.message }
  }

  // Then delete the auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(id)

  if (authError) {
    console.error("Error deleting auth user:", authError)
    return { success: false, error: authError.message }
  }

  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateUserStatus(id: string, status: "active" | "inactive" | "pending") {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from("profiles")
    .update({
      status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating user status:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/users/${id}`)
  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateUserRole(id: string, role: "admin" | "instructor" | "student") {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from("profiles")
    .update({
      role: role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating user role:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/users/${id}`)
  revalidatePath("/admin/users")
  return { success: true }
}

export async function getUserPermissions(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("user_permissions").select("*").eq("user_id", id)

  if (error) {
    console.error("Error fetching user permissions:", error)
    return []
  }

  return data.map((p) => p.permission) as string[]
}

export async function updateUserPermissions(id: string, permissions: string[]) {
  const supabase = await createServerSupabaseClient()

  // First delete existing permissions
  const { error: deleteError } = await supabase.from("user_permissions").delete().eq("user_id", id)

  if (deleteError) {
    console.error("Error deleting user permissions:", deleteError)
    return { success: false, error: deleteError.message }
  }

  // Then insert new permissions
  if (permissions.length > 0) {
    const permissionsData = permissions.map((permission) => ({
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

export async function searchUsers(query: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error searching users:", error)
    return []
  }

  return data as User[]
}

export async function filterUsersByRole(role: "admin" | "instructor" | "student" | "all") {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  if (role === "all") {
    return getUsers()
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", role)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error filtering users:", error)
    return []
  }

  return data as User[]
}

export async function filterUsersByStatus(status: "active" | "inactive" | "pending" | "all") {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  if (status === "all") {
    return getUsers()
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error filtering users:", error)
    return []
  }

  return data as User[]
}

export async function hasAdditionalRole(userId: string, role: string): Promise<boolean> {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase.from("profiles").select("metadata").eq("id", userId).single()

  if (error || !data) {
    console.error("Error checking additional roles:", error)
    return false
  }

  const metadata = data.metadata as { additional_roles?: string[] } | null
  return !!metadata?.additional_roles?.includes(role)
}

export async function addAdditionalRole(userId: string, role: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // First get the current metadata
  const { data, error: fetchError } = await supabase.from("profiles").select("metadata").eq("id", userId).single()

  if (fetchError) {
    console.error("Error fetching user metadata:", fetchError)
    return { success: false, error: fetchError.message }
  }

  // Update the metadata with the new role
  const currentMetadata = (data?.metadata as { additional_roles?: string[] } | null) || {}
  const currentRoles = currentMetadata?.additional_roles || []

  if (!currentRoles.includes(role)) {
    const updatedRoles = [...currentRoles, role]
    const updatedMetadata = { ...currentMetadata, additional_roles: updatedRoles }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating user metadata:", updateError)
      return { success: false, error: updateError.message }
    }
  }

  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}

export async function removeAdditionalRole(userId: string, role: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // First get the current metadata
  const { data, error: fetchError } = await supabase.from("profiles").select("metadata").eq("id", userId).single()

  if (fetchError) {
    console.error("Error fetching user metadata:", fetchError)
    return { success: false, error: fetchError.message }
  }

  // Update the metadata by removing the role
  const currentMetadata = (data?.metadata as { additional_roles?: string[] } | null) || {}
  const currentRoles = currentMetadata?.additional_roles || []

  if (currentRoles.includes(role)) {
    const updatedRoles = currentRoles.filter((r) => r !== role)
    const updatedMetadata = { ...currentMetadata, additional_roles: updatedRoles }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating user metadata:", updateError)
      return { success: false, error: updateError.message }
    }
  }

  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}
