import { NextRequest, NextResponse } from "next/server"
import { updateSyllabusLesson, deleteSyllabusLesson } from "@/lib/syllabus-service"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { syllabusId: string; lessonId: string } }
) {
  try {
    const updates = await request.json()

    // Add syllabus_id to the updates to satisfy the updateSyllabusLesson function
    const lessonData = {
      ...updates,
      syllabus_id: params.syllabusId
    }

    const result = await updateSyllabusLesson(params.lessonId, lessonData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update lesson" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("Error updating lesson:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { syllabusId: string; lessonId: string } }
) {
  try {
    const result = await deleteSyllabusLesson(params.lessonId, params.syllabusId)

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