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

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: aircraft, error } = await supabase
      .from("aircraft")
      .select("id, tail_number, make, model, status")
      .eq("status", "active")
      .order("tail_number")

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