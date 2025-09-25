import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data, error } = await supabase.from("errors").select("*")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ errors: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data, error } = await supabase.from("errors").insert([body]).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ error: data?.[0] })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data, error } = await supabase.from("errors").update(rest).eq("id", id).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ error: data?.[0] })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { error } = await supabase.from("errors").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 
