import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const instructorId = searchParams.get("instructorId")
  const supabase = await createServerSupabaseClient()
  let query = supabase.from("aircraft").select("id, tail_number, make, model, status")
  // Optionally filter by instructor if needed
  // (Assumes you have a way to relate aircraft to instructors)
  query = query.eq("status", "active")
  const { data, error } = await query.order("tail_number", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ aircraft: data || [] })
} 