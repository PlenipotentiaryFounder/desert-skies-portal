import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/admin/time-off/review
 * Approve or deny time-off requests (admin only)
 * Body: { id, status: 'approved' | 'denied', review_notes? }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(await cookies())
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)

    const isAdmin = userRoles?.some((ur: any) => ur.role?.name === 'admin')

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, review_notes } = body

    if (!id || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: id, status' 
      }, { status: 400 })
    }

    if (!['approved', 'denied'].includes(status)) {
      return NextResponse.json({ 
        error: 'Status must be approved or denied' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('time_off_requests')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: review_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        instructor:profiles!instructor_id(id, first_name, last_name, email, avatar_url),
        reviewer:profiles!reviewed_by(id, first_name, last_name, email)
      `)
      .single()

    if (error) {
      console.error('Error reviewing time-off request:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ request: data }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/admin/time-off/review
 * Get all time-off requests for admin review
 * Query params: status (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(await cookies())
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)

    const isAdmin = userRoles?.some((ur: any) => ur.role?.name === 'admin')

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    let query = supabase
      .from('time_off_requests')
      .select(`
        *,
        instructor:profiles!instructor_id(id, first_name, last_name, email, avatar_url),
        reviewer:profiles!reviewed_by(id, first_name, last_name, email)
      `)
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


