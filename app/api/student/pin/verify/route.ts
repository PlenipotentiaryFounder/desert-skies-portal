import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { getUserFromApiRequest } from '@/lib/user-service'

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromApiRequest(req)
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pin } = await req.json()

    // Validate PIN format
    if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({
        error: 'PIN must be exactly 4 digits'
      }, { status: 400 })
    }

    const supabase = await createClient(await cookies())

    // Get stored PIN hash
    const { data: pinRecord, error } = await supabase
      .from('student_pins')
      .select('pin_hash, is_active')
      .eq('student_id', user.id)
      .eq('is_active', true)
      .single()

    if (error || !pinRecord) {
      return NextResponse.json({
        error: 'PIN not found. Please set up your PIN first.'
      }, { status: 404 })
    }

    // Verify PIN
    const isValidPIN = await bcrypt.compare(pin, pinRecord.pin_hash)

    if (!isValidPIN) {
      return NextResponse.json({
        error: 'Invalid PIN'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      message: 'PIN verified successfully'
    })

  } catch (error) {
    console.error('PIN verification error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
