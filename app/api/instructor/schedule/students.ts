import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("students")
    .select("id, first_name, last_name, email, avatar_url, status")
    .eq("status", "active")
    .order("last_name", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ students: data || [] })
} 