import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data, error } = await supabase.from("resources").select("*")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ resources: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data, error } = await supabase.from("resources").insert([body]).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ resource: data?.[0] })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data, error } = await supabase.from("resources").update(rest).eq("id", id).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ resource: data?.[0] })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { error } = await supabase.from("resources").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 
