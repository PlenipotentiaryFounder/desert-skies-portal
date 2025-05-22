"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createClient } from '@supabase/supabase-js'
import type { Database } from "@/types/supabase"
import { cookies } from "next/headers"

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

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.");
  }
  return createClient(url, key);
}

export async function getUsers() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  if (error || !Array.isArray(data)) {
    console.error("Error fetching users:", error)
    return []
  }

  return data as unknown as Database["public"]["Tables"]["profiles"]["Row"][]
}

export async function getUserById(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from("profiles").select("*").eq("id" as any, id as any).single()
  if (error || !data) {
    console.error("Error fetching user:", error)
    return null
  }
  return data as unknown as Database["public"]["Tables"]["profiles"]["Row"]
}

export async function getStudents() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role" as any, "student" as any)
    .order("created_at", { ascending: false })
  if (error || !Array.isArray(data)) {
    console.error("Error fetching students:", error)
    return []
  }
  return data as unknown as Database["public"]["Tables"]["profiles"]["Row"][]
}

export async function getInstructors() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role" as any, "instructor" as any)
    .order("created_at", { ascending: false })
  if (error || !Array.isArray(data)) {
    console.error("Error fetching instructors:", error)
    return []
  }
  return data as unknown as Database["public"]["Tables"]["profiles"]["Row"][]
}

export async function getPendingInstructors() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role" as any, "instructor" as any)
    .eq("status" as any, "pending" as any)
    .order("created_at", { ascending: false })
  if (error || !Array.isArray(data)) {
    console.error("Error fetching pending instructors:", error)
    return []
  }
  return data as unknown as Database["public"]["Tables"]["profiles"]["Row"][]
}

export async function createUser(userData: NewUser) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    password: userData.password || Math.random().toString(36).slice(-8),
    email_confirm: true,
  })
  if (authError) {
    console.error("Error creating auth user:", authError)
    return { success: false, error: authError.message }
  }
  const profileInsert: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: authData.user.id,
    email: userData.email,
    first_name: userData.first_name,
    last_name: userData.last_name,
    role: userData.role,
  }
  if (userData.phone) profileInsert.phone = userData.phone
  if (userData.bio) profileInsert.bio = userData.bio
  const { error: profileError } = await supabaseAdmin.from("profiles").insert(profileInsert as any)
  if (profileError) {
    console.error("Error creating user profile:", profileError)
    return { success: false, error: profileError.message }
  }
  revalidatePath("/admin/users")
  return { success: true, userId: authData.user.id }
}

export async function updateUser(id: string, userData: Partial<User>) {
  const supabase = await createServerSupabaseClient()
  const updateData: Database["public"]["Tables"]["profiles"]["Update"] = {}
  if (userData.first_name) updateData.first_name = userData.first_name
  if (userData.last_name) updateData.last_name = userData.last_name
  if (userData.role) updateData.role = userData.role
  if (userData.phone) updateData.phone = userData.phone
  if (userData.bio) updateData.bio = userData.bio
  updateData.updated_at = new Date().toISOString()
  const { error } = await supabase
    .from("profiles")
    .update(updateData as any)
    .eq("id" as any, id as any)
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
  const { error: profileError } = await supabase.from("profiles").delete().eq("id" as any, id as any)
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
  const supabase = await createServerSupabaseClient()
  const updateData: Database["public"]["Tables"]["profiles"]["Update"] = { updated_at: new Date().toISOString() }
  const { error } = await supabase
    .from("profiles")
    .update(updateData as any)
    .eq("id" as any, id as any)
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
  const updateData: Database["public"]["Tables"]["profiles"]["Update"] = { role: role, updated_at: new Date().toISOString() }
  const { error } = await supabase
    .from("profiles")
    .update(updateData as any)
    .eq("id" as any, id as any)
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
  const { data, error } = await supabase.from("user_permissions").select("*").eq("user_id", String(id))
  if (error || !Array.isArray(data)) {
    console.error("Error fetching user permissions:", error)
    return []
  }
  return data.map((p) => p.permission) as string[]
}

export async function updateUserPermissions(id: string, permissions: string[]) {
  const supabase = await createServerSupabaseClient()
  const { error: deleteError } = await supabase.from("user_permissions").delete().eq("user_id", String(id))
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

  return data as Database["public"]["Tables"]["profiles"]["Row"][]
}

export async function filterUsersByRole(role: "admin" | "instructor" | "student" | "all") {
  const cookieStore = cookies()
  const supabase = await createServerSupabaseClient()

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

  return data as Database["public"]["Tables"]["profiles"]["Row"][]
}

export async function filterUsersByStatus(status: "active" | "inactive" | "pending" | "all") {
  const cookieStore = cookies()
  const supabase = await createServerSupabaseClient()

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

  return data as Database["public"]["Tables"]["profiles"]["Row"][]
}

export async function getCurrentInstructor() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;
  const { data: profile, error } = await supabase.from("profiles").select("*, metadata").eq("id", user.id).single();
  if (error || !profile) return null;
  const additionalRoles = profile.metadata?.additional_roles || [];
  const isInstructor = profile.role === "instructor" || additionalRoles.includes("instructor") || profile.role === "admin";
  if (!isInstructor) return null;
  return profile as User;
}
