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

    // Hash the PIN
    const saltRounds = 10
    const hashedPIN = await bcrypt.hash(pin, saltRounds)

    // Check if student already has a PIN
    const { data: existingPIN } = await supabase
      .from('student_pins')
      .select('id')
      .eq('student_id', user.id)
      .single()

    if (existingPIN) {
      // Update existing PIN
      const { error } = await supabase
        .from('student_pins')
        .update({
          pin_hash: hashedPIN,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', user.id)

      if (error) {
        console.error('Error updating PIN:', error)
        return NextResponse.json({
          error: 'Failed to update PIN'
        }, { status: 500 })
      }
    } else {
      // Create new PIN
      const { error } = await supabase
        .from('student_pins')
        .insert({
          student_id: user.id,
          pin_hash: hashedPIN,
          is_active: true
        })

      if (error) {
        console.error('Error creating PIN:', error)
        return NextResponse.json({
          error: 'Failed to create PIN'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'PIN set successfully'
    })

  } catch (error) {
    console.error('PIN setup error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
