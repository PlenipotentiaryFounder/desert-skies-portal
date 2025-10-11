import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiRouteClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has admin role
    const { data: userRoles, error: rolesError } = await supabase.rpc('get_user_roles_for_middleware', {
      p_user_id: user.id
    })

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return NextResponse.json({ error: "Failed to verify permissions" }, { status: 500 })
    }

    const roles = userRoles as { role_name: string }[] || []
    const hasAdmin = roles.some(r => r.role_name === 'admin')

    if (!hasAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get all active instructors - simplified query
    const { data: instructors, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('status', 'active')
      .order('first_name')
      .not('first_name', 'is', null)

    if (error) {
      console.error('Error fetching instructors:', error)
      throw new Error('Failed to fetch instructors')
    }

    return NextResponse.json(instructors || [])
  } catch (error) {
    console.error('Error in instructors API:', error)
    return NextResponse.json(
      { error: "Failed to fetch instructors" },
      { status: 500 }
    )
  }
}
