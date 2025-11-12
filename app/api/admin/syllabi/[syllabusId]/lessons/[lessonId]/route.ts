import { NextRequest, NextResponse } from "next/server"
import { updateSyllabusLesson, deleteSyllabusLesson } from "@/lib/syllabus-service"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ syllabusId: string; lessonId: string }> }
) {
  try {
    const resolvedParams = await params
    const updates = await request.json()
    
    console.log('[API] Updating lesson:', resolvedParams.lessonId)
    console.log('[API] Updates received:', Object.keys(updates))

    // Add syllabus_id to the updates to satisfy the updateSyllabusLesson function
    const lessonData = {
      ...updates,
      syllabus_id: resolvedParams.syllabusId
    }

    const result = await updateSyllabusLesson(resolvedParams.lessonId, lessonData)

    if (!result.success) {
      console.error('[API] Update failed:', result.error)
      return NextResponse.json(
        { error: result.error || "Failed to update lesson" },
        { status: 500 }
      )
    }

    console.log('[API] Update successful')
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("[API] Error updating lesson:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ syllabusId: string; lessonId: string }> }
) {
  try {
    const resolvedParams = await params
    const result = await deleteSyllabusLesson(resolvedParams.lessonId, resolvedParams.syllabusId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete lesson" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting lesson:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 