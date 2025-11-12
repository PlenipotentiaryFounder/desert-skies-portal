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
    const {
      question_text,
      category_id,
      question_type,
      is_disqualifying,
      help_text,
      is_active,
      display_order,
      answer_options,
      numeric_ranges
    } = body;

    // Update question
    const { error: questionError } = await supabase
      .from('risk_assessment_questions')
      .update({
        question_text,
        category_id,
        question_type,
        is_disqualifying,
        help_text,
        is_active,
        display_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (questionError) {
      throw questionError;
    }

    // Update answer options for multiple choice questions
    if (question_type === 'multiple_choice' && answer_options) {
      // Get existing answer options
      const { data: existingOptions } = await supabase
        .from('risk_assessment_answer_options')
        .select('id')
        .eq('question_id', params.id);

      const existingIds = new Set((existingOptions || []).map(o => o.id));
      const updatedIds = new Set(
        answer_options
          .filter((o: any) => !o.id.startsWith('new-'))
          .map((o: any) => o.id)
      );

      // Delete removed options
      const idsToDelete = Array.from(existingIds).filter(id => !updatedIds.has(id));
      if (idsToDelete.length > 0) {
        await supabase
          .from('risk_assessment_answer_options')
          .delete()
          .in('id', idsToDelete);
      }

      // Upsert answer options
      for (let i = 0; i < answer_options.length; i++) {
        const option = answer_options[i];
        const isNew = option.id.startsWith('new-');

        if (isNew) {
          // Insert new option
          await supabase
            .from('risk_assessment_answer_options')
            .insert({
              question_id: params.id,
              answer_text: option.answer_text,
              risk_score: option.risk_score,
              is_disqualifying: option.is_disqualifying,
              display_order: i
            });
        } else {
          // Update existing option
          await supabase
            .from('risk_assessment_answer_options')
            .update({
              answer_text: option.answer_text,
              risk_score: option.risk_score,
              is_disqualifying: option.is_disqualifying,
              display_order: i
            })
            .eq('id', option.id);
        }
      }
    }

    // Update numeric ranges for numeric questions
    if (question_type === 'numeric' && numeric_ranges) {
      // Get existing numeric ranges
      const { data: existingRanges } = await supabase
        .from('risk_assessment_numeric_ranges')
        .select('id')
        .eq('question_id', params.id);

      const existingIds = new Set((existingRanges || []).map(r => r.id));
      const updatedIds = new Set(
        numeric_ranges
          .filter((r: any) => !r.id.startsWith('new-'))
          .map((r: any) => r.id)
      );

      // Delete removed ranges
      const idsToDelete = Array.from(existingIds).filter(id => !updatedIds.has(id));
      if (idsToDelete.length > 0) {
        await supabase
          .from('risk_assessment_numeric_ranges')
          .delete()
          .in('id', idsToDelete);
      }

      // Upsert numeric ranges
      for (let i = 0; i < numeric_ranges.length; i++) {
        const range = numeric_ranges[i];
        const isNew = range.id.startsWith('new-');

        if (isNew) {
          // Insert new range
          await supabase
            .from('risk_assessment_numeric_ranges')
            .insert({
              question_id: params.id,
              min_value: range.min_value,
              max_value: range.max_value,
              risk_score: range.risk_score,
              is_disqualifying: range.is_disqualifying,
              range_label: range.range_label,
              display_order: i
            });
        } else {
          // Update existing range
          await supabase
            .from('risk_assessment_numeric_ranges')
            .update({
              min_value: range.min_value,
              max_value: range.max_value,
              risk_score: range.risk_score,
              is_disqualifying: range.is_disqualifying,
              range_label: range.range_label,
              display_order: i
            })
            .eq('id', range.id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

