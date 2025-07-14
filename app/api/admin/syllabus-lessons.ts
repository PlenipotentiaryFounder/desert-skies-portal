import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getSyllabusLessonById } from "@/lib/syllabus-service"

// POST: Create new lesson with tags
export async function POST(req: NextRequest) {
  const body = await req.json()
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  // Insert lesson
  const { lesson, maneuvers, coreTopics, resources, whatToBring, ...lessonFields } = body
  const { data: lessonData, error: lessonError } = await supabase.from("syllabus_lessons").insert([lessonFields]).select()
  if (lessonError) return NextResponse.json({ error: lessonError.message }, { status: 500 })
  const lessonId = lessonData?.[0]?.id
  // Insert join table records
  if (lessonId) {
    if (maneuvers?.length) await supabase.from("lesson_maneuvers").insert(maneuvers.map((m: any) => ({ lesson_id: lessonId, maneuver_id: m.id, ...m })))
    if (coreTopics?.length) await supabase.from("lesson_core_topics").insert(coreTopics.map((t: any) => ({ lesson_id: lessonId, core_topic_id: t.id, ...t })))
    if (resources?.length) await supabase.from("lesson_resources").insert(resources.map((r: any) => ({ lesson_id: lessonId, resource_id: r.id, ...r })))
    if (whatToBring?.length) await supabase.from("lesson_what_to_bring").insert(whatToBring.map((i: any) => ({ lesson_id: lessonId, what_to_bring_id: i.id, ...i })))
  }
  return NextResponse.json({ lesson: lessonData?.[0] })
}

// PUT: Update lesson and tags
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { id, maneuvers, coreTopics, resources, whatToBring, ...lessonFields } = body
  // Update lesson
  const { data: lessonData, error: lessonError } = await supabase.from("syllabus_lessons").update(lessonFields).eq("id", id).select()
  if (lessonError) return NextResponse.json({ error: lessonError.message }, { status: 500 })
  // Remove old join table records
  await supabase.from("lesson_maneuvers").delete().eq("lesson_id", id)
  await supabase.from("lesson_core_topics").delete().eq("lesson_id", id)
  await supabase.from("lesson_resources").delete().eq("lesson_id", id)
  await supabase.from("lesson_what_to_bring").delete().eq("lesson_id", id)
  // Insert new join table records
  if (maneuvers?.length) await supabase.from("lesson_maneuvers").insert(maneuvers.map((m: any) => ({ lesson_id: id, maneuver_id: m.id, ...m })))
  if (coreTopics?.length) await supabase.from("lesson_core_topics").insert(coreTopics.map((t: any) => ({ lesson_id: id, core_topic_id: t.id, ...t })))
  if (resources?.length) await supabase.from("lesson_resources").insert(resources.map((r: any) => ({ lesson_id: id, resource_id: r.id, ...r })))
  if (whatToBring?.length) await supabase.from("lesson_what_to_bring").insert(whatToBring.map((i: any) => ({ lesson_id: id, what_to_bring_id: i.id, ...i })))
  return NextResponse.json({ lesson: lessonData?.[0] })
}

// GET: Fetch lesson by id (with tags)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const lesson = await getSyllabusLessonById(id)
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
  return NextResponse.json({ lesson })
} 