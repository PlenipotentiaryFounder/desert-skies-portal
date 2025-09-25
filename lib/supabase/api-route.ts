import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

/**
 * Creates a Supabase client for API routes with proper session handling
 * This follows the latest Supabase SSR best practices
 */
export async function createApiRouteClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from an API route.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name, options) {
          try {
            cookieStore.delete(name, options)
          } catch {
            // The `remove` method was called from an API route.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Authenticates a user in an API route and returns the user object
 * Throws an error if authentication fails
 */
export async function authenticateApiRoute() {
  const supabase = await createApiRouteClient()
  
  // Get the current user directly (this includes session validation)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    throw new Error(`User authentication error: ${userError.message}`)
  }
  
  if (!user) {
    throw new Error('No user found in session')
  }
  
  return { user, supabase }
}

/**
 * Authenticates a user and checks if they have a specific role
 */
export async function authenticateApiRouteWithRole(requiredRole: string) {
  const { user, supabase } = await authenticateApiRoute()
  
  // Check if user has the required role
  const { data: userRole, error: userRoleError } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', user.id)
    .single()

  if (userRoleError) {
    throw new Error(`Failed to fetch user role: ${userRoleError.message}`)
  }

  if (!userRole) {
    throw new Error('User role not found')
  }

  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('name')
    .eq('id', userRole.role_id)
    .single()

  if (roleError) {
    throw new Error(`Failed to fetch role details: ${roleError.message}`)
  }

  if (!role) {
    throw new Error('Role not found')
  }

  if (role.name !== requiredRole) {
    throw new Error(`User is not a ${requiredRole}. Current role: ${role.name}`)
  }

  return { user, supabase, role: role.name }
} 