import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { importForeFlightCSV, previewForeFlightImport } from '@/lib/foreflight-importer-service'

/**
 * POST /api/instructor/logbook/import-foreflight
 * Import ForeFlight CSV into instructor's logbook
 * 
 * Body: { csvContent: string, preview?: boolean, skipDuplicates?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user profile to verify instructor role
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()
    
    // Check if user has instructor or admin role
    const hasInstructorAccess = profile?.roles?.includes('instructor') || profile?.roles?.includes('admin')
    
    if (!profile || !hasInstructorAccess) {
      return NextResponse.json(
        { success: false, error: 'Only instructors can import logbook data' },
        { status: 403 }
      )
    }
    
    const body = await req.json()
    const { csvContent, preview = false, skipDuplicates = true } = body
    
    if (!csvContent) {
      return NextResponse.json(
        { success: false, error: 'CSV content is required' },
        { status: 400 }
      )
    }
    
    // Preview mode: parse and validate without importing
    if (preview) {
      const previewResult = await previewForeFlightImport(csvContent, user.id)
      return NextResponse.json(previewResult)
    }
    
    // Import mode: actually create logbook entries
    // Note: For instructors, the logbook entries are created with:
    // - student_id = instructor's user ID (they are the "student" in their own logbook)
    // - dual_given hours (instead of dual_received)
    // - PIC time (instructors are PIC when giving instruction)
    const importResult = await importForeFlightCSV(csvContent, user.id, skipDuplicates)
    
    return NextResponse.json(importResult)
    
  } catch (error) {
    console.error('Error in instructor import-foreflight API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

