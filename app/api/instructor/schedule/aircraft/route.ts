import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const instructorId = searchParams.get("instructorId")
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  let query = supabase.from("aircraft").select("id, tail_number, make, model, is_active")
  // Optionally filter by instructor if needed
  // (Assumes you have a way to relate aircraft to instructors)
  query = query.eq("is_active", true)
  const { data, error } = await query.order("tail_number", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ aircraft: data || [] })
} 