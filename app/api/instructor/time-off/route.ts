import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/instructor/time-off
 * Fetch time-off requests for instructor
 * Query params: instructor_id, status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const instructorId = searchParams.get('instructor_id') || user.id
    const status = searchParams.get('status')

    let query = supabase
      .from('time_off_requests')
      .select(`
        *,
        instructor:profiles!instructor_id(id, first_name, last_name, email, avatar_url),
        reviewer:profiles!reviewed_by(id, first_name, last_name, email)
      `)
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching time-off requests:', error)
      return NextResponse.json({ error: 'Failed to fetch time-off requests' }, { status: 500 })
    }

    return NextResponse.json({ requests: data }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/instructor/time-off
 * Create new time-off request
 * Body: { start_date, end_date, reason, notes? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { start_date, end_date, reason, notes } = body

    if (!start_date || !end_date || !reason) {
      return NextResponse.json({ 
        error: 'Missing required fields: start_date, end_date, reason' 
      }, { status: 400 })
    }

    // Validate date range
    if (new Date(end_date) < new Date(start_date)) {
      return NextResponse.json({ 
        error: 'End date must be after or equal to start date' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('time_off_requests')
      .insert({
        instructor_id: user.id,
        start_date,
        end_date,
        reason,
        notes: notes || null,
        status: 'pending',
      })
      .select(`
        *,
        instructor:profiles!instructor_id(id, first_name, last_name, email, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Error creating time-off request:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ request: data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/instructor/time-off
 * Update time-off request (cancel or modify pending requests)
 * Body: { id, status?, notes? }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Verify ownership and current status
    const { data: existing } = await supabase
      .from('time_off_requests')
      .select('instructor_id, status')
      .eq('id', id)
      .single()

    if (!existing || existing.instructor_id !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
    }

    // Only allow instructors to cancel their own pending/approved requests
    if (status && status !== 'cancelled') {
      return NextResponse.json({ 
        error: 'Instructors can only cancel their requests' 
      }, { status: 403 })
    }

    const updates: any = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (notes !== undefined) updates.notes = notes

    const { data, error } = await supabase
      .from('time_off_requests')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        instructor:profiles!instructor_id(id, first_name, last_name, email, avatar_url),
        reviewer:profiles!reviewed_by(id, first_name, last_name, email)
      `)
      .single()

    if (error) {
      console.error('Error updating time-off request:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ request: data }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/instructor/time-off
 * Delete time-off request (only pending requests)
 * Query param: id
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Verify ownership and only allow deletion of pending requests
    const { data: existing } = await supabase
      .from('time_off_requests')
      .select('instructor_id, status')
      .eq('id', id)
      .single()

    if (!existing || existing.instructor_id !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
    }

    if (existing.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Can only delete pending requests. Use cancel for approved requests.' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('time_off_requests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting time-off request:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


