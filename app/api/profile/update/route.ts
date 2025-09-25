import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await req.json()
  const { first_name, last_name, phone, bio, avatar_url } = body

  const { error } = await supabase.from("profiles").update({
    first_name,
    last_name,
    phone,
    bio,
    avatar_url,
    updated_at: new Date().toISOString(),
  }).eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
} 
