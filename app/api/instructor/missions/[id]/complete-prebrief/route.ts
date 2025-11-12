import { NextRequest, NextResponse } from "next/server"
import { completePreBrief } from "@/lib/mission-service"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { poaId } = body

    if (!poaId) {
      return NextResponse.json(
        { success: false, error: "POA ID is required" },
        { status: 400 }
      )
    }

    const result = await completePreBrief(params.id, poaId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in complete-prebrief API:", error)
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

