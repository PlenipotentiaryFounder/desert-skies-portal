import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    // Create Supabase client with cookies - this automatically handles authentication
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    // Get authenticated user - the SSR package handles cookie parsing automatically
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[Aircraft API] Authentication failed:', authError?.message)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log('[Aircraft API] User authenticated:', user.id)

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')

    let query = supabase
      .from("aircraft")
      .select("id, tail_number, make, model, year, category, class, is_active")
      .eq("is_active", true)

    // Add search filter if provided
    if (search) {
      query = query.or(`tail_number.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`)
    }

    const { data: aircraft, error } = await query.order("tail_number")

    if (error) {
      console.error("Error fetching aircraft:", error)
      return NextResponse.json({ error: "Failed to fetch aircraft" }, { status: 500 })
    }

    return NextResponse.json({ aircraft })
  } catch (error) {
    console.error("Error in aircraft GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
