import { NextRequest, NextResponse } from "next/server"
import { getSuggestedMissions } from "@/lib/lesson-progress-service"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await getSuggestedMissions(id)
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error fetching lesson suggestions:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch lesson suggestions" },
      { status: 500 }
    )
  }
}

