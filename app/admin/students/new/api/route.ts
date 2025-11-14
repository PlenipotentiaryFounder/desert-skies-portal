import { NextRequest, NextResponse } from 'next/server'
import { adminAddStudentServerAction } from '../page.server'

/**
 * Admin Add Student API Route
 * Wraps the server action to make it accessible from the client component form
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    
    // Validate required fields
    if (!data.email || !data.firstName || !data.lastName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, firstName, lastName' },
        { status: 400 }
      )
    }

    if (!data.instructorIds || !Array.isArray(data.instructorIds) || data.instructorIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one instructor must be assigned' },
        { status: 400 }
      )
    }

    // Call the server action
    const result = await adminAddStudentServerAction(data)
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }
    
    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Error in admin add student API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error occurred' },
      { status: 500 }
    )
  }
}

