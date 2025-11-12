import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { EditQuestionForm } from '@/components/admin/edit-question-form';
import { getCategories } from '@/lib/risk-assessment-service';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function EditQuestionPage({
  params
}: {
  params: { id: string };
}) {
  const supabase = await createClient(await cookies());

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', user.id);

  const isAdmin = userRoles?.some((ur: any) => ur.role?.name === 'admin');

  if (!isAdmin) {
    redirect('/student/dashboard');
  }

  try {
    // Get question with all details
    const { data: question, error: questionError } = await supabase
      .from('risk_assessment_questions')
      .select(`
        *,
        category:risk_assessment_categories(*),
        answer_options:risk_assessment_answer_options(*),
        numeric_ranges:risk_assessment_numeric_ranges(*)
      `)
      .eq('id', params.id)
      .single();

    if (questionError || !question) {
      return (
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500">Question Not Found</h1>
            <p className="text-muted-foreground mt-2">
              The requested question could not be found.
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/risk-assessment-management">
                Return to Management
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    const categories = await getCategories();

    // Sort answer options and numeric ranges
    const sortedQuestion = {
      ...question,
      answer_options: (question.answer_options || []).sort(
        (a: any, b: any) => a.display_order - b.display_order
      ),
      numeric_ranges: (question.numeric_ranges || []).sort(
        (a: any, b: any) => a.display_order - b.display_order
      )
    };

    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/admin/risk-assessment-management">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Management
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Question</h1>
          <p className="text-muted-foreground mt-2">
            Modify question text, answers, and risk scores
          </p>
        </div>

        <EditQuestionForm question={sortedQuestion} categories={categories} />
      </div>
    );
  } catch (error) {
    console.error('Error loading question:', error);
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p className="text-muted-foreground mt-2">
            Failed to load question details.
          </p>
        </div>
      </div>
    );
  }
}

