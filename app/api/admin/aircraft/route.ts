import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getUserFromApiRequest } from "@/lib/user-service"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromApiRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

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

    const { data: aircraft, error } = await supabase
      .from("aircraft")
      .select("id, tail_number, make, model, year, category, class, is_active, hobbs_time, last_inspection_date, next_inspection_date")
      .eq("is_active", true)
      .order("tail_number")

    if (error) {
      console.error("Error fetching aircraft:", error)
      return NextResponse.json({ error: "Failed to fetch aircraft" }, { status: 500 })
    }

    return NextResponse.json(aircraft || [])
  } catch (error) {
    console.error("Error in admin aircraft GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}










