import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient(await cookies());

    // Verify authentication and admin role
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(
      (ur: any) => ur.role?.name === 'admin'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, max_allowed_score } = body;

    // Validate max_allowed_score
    if (max_allowed_score < 1 || max_allowed_score > 100) {
      return NextResponse.json(
        { error: 'Max allowed score must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Update configuration
    const { error: configError } = await supabase
      .from('risk_assessment_config')
      .update({
        name,
        description,
        max_allowed_score,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (configError) {
      throw configError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

