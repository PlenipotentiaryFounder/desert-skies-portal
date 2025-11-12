"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database } from "@/types/supabase"
import { cookies } from "next/headers"
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { createApiSupabaseClient } from './supabase/api'

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
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data as User[]
}

export async function getUserById(id: string): Promise<User | null> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single()
  if (error || !data) {
    return null
  }

  // Get user roles using the proper database function
  const { data: rolesData, error: rolesError } = await supabase.rpc("get_user_roles_for_middleware", { p_user_id: id })

  if (rolesError) {
    console.error("Error fetching user roles:", rolesError)
    // Return profile without roles if roles fetch fails
    return { ...data, roles: [] } as User
  }

  // Return as array of role names
  const roles = rolesData.map((r: any) => r.role_name)

  return { ...data, roles } as User
}

export async function getStudents(): Promise<User[]> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error || !Array.isArray(data)) {
    return []
  }

  // Filter to only students - this would need proper role checking in a full implementation
  return data as User[]
}

export async function getInstructors(): Promise<User[]> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error || !Array.isArray(data)) {
    return []
  }

  // Filter to only instructors - this would need proper role checking in a full implementation
  return data as User[]
}

export async function getActiveInstructors(): Promise<User[]> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
  if (error || !Array.isArray(data)) {
    return []
  }

  // Filter to only instructors - this would need proper role checking in a full implementation
  return data as User[]
}

export async function getPendingInstructors(): Promise<User[]> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
  if (error || !Array.isArray(data)) {
    return []
  }

  // Filter to only instructors - this would need proper role checking in a full implementation
  return data as User[]
}

export async function createUser(userData: NewUser) {
  // Use the service role key for admin operations
  const supabase = createSupabaseAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  )

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
  const supabase = await createClient(cookieStore)
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
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/users/${id}`)
  revalidatePath("/admin/users")

  return { success: true, id, ...userData }
}

export async function deleteUser(id: string) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
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
  const supabase = await createClient(cookieStore)
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
  const supabase = await createClient(cookieStore)

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
  const supabase = await createClient(cookieStore)
  const { data, error } = await supabase.from("user_permissions").select("permission").eq("user_id", id)
  if (error || !Array.isArray(data)) {
    console.error("Error fetching user permissions:", error)
    return []
  }
  return data.map((p) => p.permission) as string[]
}

export async function updateUserPermissions(id: string, permissions: string[]) {
  // Use the admin client to bypass RLS
  const supabase = createSupabaseAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  )
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
  const supabase = await createClient(cookieStore)
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
  const supabase = await createClient(cookieStore)
  let query = supabase.from("profiles").select("*")
  if (role !== "all") {
    // For now, just return all active users - roles system needs to be implemented
    query = query.eq("status", "active")
  }
  const { data, error } = await query.order("created_at", { ascending: false })

  if (error || !Array.isArray(data)) {
    return []
  }
  return data as User[]
}

export async function filterUsersByStatus(status: "active" | "inactive" | "pending" | "all"): Promise<User[]> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
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
  const supabase = await createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return getUserProfileWithRoles(user.id)
}

export async function getUserProfileWithRoles(userId: string): Promise<User | null> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data: profile, error: profileError } = await supabase.from("profiles").select(`*`).eq("id", userId).single()

  if (profileError) {
    console.error("Error fetching user profile:", profileError)
    return null
  }

  // Get user roles using the proper database function
  const { data: rolesData, error: rolesError } = await supabase.rpc("get_user_roles_for_middleware", { p_user_id: userId })

  if (rolesError) {
    console.error("Error fetching user roles:", rolesError)
    // Return profile without roles if roles fetch fails
    return { ...profile, roles: [] } as User
  }

  // Return as array of role names
  const roles = rolesData.map((r: any) => r.role_name)

  return { ...profile, roles } as User
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) return null
  return data as User
}

/**
 * Extracts the authenticated user from a Next.js API route request using Supabase cookies.
 * Returns null if not authenticated.
 */
export async function getUserFromRequest(req: NextRequest): Promise<User | null> {
  // Get cookies from the request
  const cookieHeader = req.headers.get('cookie') || '';
  // Create a cookie store compatible with supabase/server
  // next/headers cookies() is not available in API routes, so we parse manually
  const cookieMap = new Map<string, string>();
  for (const pair of cookieHeader.split(';')) {
    const [key, ...rest] = pair.trim().split('=');
    if (key && rest.length > 0) cookieMap.set(key, rest.join('='));
  }
  // Create a minimal cookieStore interface
  const cookieStore = {
    get: (name: string) => ({ value: cookieMap.get(name) }),
    set: () => {},
  };
  const supabase = await createClient(cookieStore as any);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  // Get profile and roles
  const profile = await getUserProfileWithRoles(user.id);
  if (!profile) return null;
  // Attach role (for compatibility with route logic)
  if (profile.roles && profile.roles.length > 0) {
    (profile as any).role = profile.roles[0];
  }
  return profile;
}

export async function getUserFromApiRequest(req: NextRequest): Promise<User | null> {
  try {
    // Parse cookies from the request
    const cookieHeader = req.headers.get('cookie') || '';
    console.log('[AUTH DEBUG] Cookie header present:', !!cookieHeader);
    
    const match = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
    
    if (!match) {
      console.log('[AUTH DEBUG] No auth token cookie found in header');
      return null;
    }

    console.log('[AUTH DEBUG] Found auth cookie, attempting to decode...');
    
    // The cookie value is base64-encoded JSON containing the session
    const cookieValue = decodeURIComponent(match[1]);
    
    let jwt: string | undefined;
    
    try {
      // Try to decode as base64 JSON first (standard Supabase format)
      const decodedSession = Buffer.from(cookieValue, 'base64').toString('utf-8');
      const session = JSON.parse(decodedSession);
      jwt = session.access_token;
      console.log('[AUTH DEBUG] Successfully decoded base64 session, JWT present:', !!jwt);
    } catch (decodeError) {
      // If that fails, maybe it's already a JWT (fallback)
      console.log('[AUTH DEBUG] Base64 decode failed, treating as direct JWT');
      jwt = cookieValue;
    }
    
    if (!jwt) {
      console.log('[AUTH DEBUG] No JWT token available after decoding');
      return null;
    }

    console.log('[AUTH DEBUG] Creating Supabase client with JWT');
    const supabase = createApiSupabaseClient(jwt);
    
    console.log('[AUTH DEBUG] Calling supabase.auth.getUser()');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[AUTH DEBUG] Error getting user from Supabase:', error);
      return null;
    }
    
    if (!user) {
      console.log('[AUTH DEBUG] No user returned from getUser()');
      return null;
    }
    
    console.log('[AUTH DEBUG] User authenticated successfully:', user.id);
    
    const profile = await getUserProfileWithRoles(user.id);
    if (!profile) {
      console.log('[AUTH DEBUG] Profile not found for user:', user.id);
      return null;
    }
    
    if (profile.roles && profile.roles.length > 0) {
      (profile as any).role = profile.roles[0];
    }
    
    console.log('[AUTH DEBUG] Authentication complete, user:', user.id, 'roles:', profile.roles);
    return profile;
  } catch (error) {
    console.error('[AUTH DEBUG] Unexpected error in getUserFromApiRequest:', error);
    return null;
  }
}
