import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createAssessment, type CreateAssessmentInput } from '@/lib/risk-assessment-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(await cookies());

    // Verify authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { student_id, flight_session_id, mission_id, responses, notes } = body;

    // Verify the user is creating their own assessment or is an instructor
    if (student_id !== user.id) {
      // Check if user is instructor
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role:roles(name)')
        .eq('user_id', user.id);

      const isInstructor = userRoles?.some(
        (ur: any) => ur.role?.name === 'instructor' || ur.role?.name === 'admin'
      );

      if (!isInstructor) {
        return NextResponse.json(
          { error: 'You can only create assessments for yourself' },
          { status: 403 }
        );
      }
    }

    // Validate input
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { error: 'Responses are required' },
        { status: 400 }
      );
    }

    const input: CreateAssessmentInput = {
      student_id,
      flight_session_id,
      mission_id,
      responses,
      notes
    };

    const result = await createAssessment(input);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating risk assessment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create assessment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(await cookies());

    // Verify authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Check if user is instructor or accessing their own data
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id);

    const isInstructor = userRoles?.some(
      (ur: any) => ur.role?.name === 'instructor' || ur.role?.name === 'admin'
    );

    let query = supabase
      .from('risk_assessments')
      .select(`
        *,
        student:profiles!risk_assessments_student_id_fkey(first_name, last_name, email),
        flight_session:flight_sessions(scheduled_start, scheduled_end)
      `)
      .order('completed_at', { ascending: false })
      .limit(limit);

    // If not instructor, only show their own assessments
    if (!isInstructor) {
      query = query.eq('student_id', user.id);
    } else if (studentId) {
      // Instructor filtering by specific student
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching risk assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

