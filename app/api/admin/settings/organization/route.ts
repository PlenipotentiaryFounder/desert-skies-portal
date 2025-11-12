import { NextRequest, NextResponse } from "next/server"
import { updateOrganizationSettings } from "@/lib/organization-settings-service"

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await updateOrganizationSettings(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("Error in organization settings API:", error)
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

