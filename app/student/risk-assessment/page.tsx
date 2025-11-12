import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { RiskAssessmentForm } from '@/components/student/risk-assessment-form';
import {
  getQuestionsWithOptions,
  getActiveConfig
} from '@/lib/risk-assessment-service';

export default async function RiskAssessmentPage({
  searchParams
}: {
  searchParams: { mission_id?: string };
}) {
  const supabase = await createClient(await cookies());

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const missionId = searchParams.mission_id;

  try {
    const [questions, config] = await Promise.all([
      getQuestionsWithOptions(),
      getActiveConfig()
    ]);

    if (!config) {
      return (
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Risk Assessment Not Available</h1>
            <p className="text-muted-foreground mt-2">
              The risk assessment system is not currently configured. Please contact your instructor.
            </p>
          </div>
        </div>
      );
    }

    // Group questions by category for display
    const questionsByCategory = questions.reduce((acc, question) => {
      const categoryName = question.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(question);
      return acc;
    }, {} as Record<string, typeof questions>);

    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Pre-Flight Risk Assessment</h1>
          <p className="text-muted-foreground mt-2">
            Complete this assessment before each flight to evaluate safety conditions and risk factors.
            This is a required safety tool to help you make informed go/no-go decisions.
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>How it works:</strong> Answer all {questions.length} questions honestly. 
              Each answer has a risk score. Your total score must be {config.max_allowed_score} or below to fly.
              Some conditions automatically disqualify you from flying.
            </p>
          </div>
        </div>

        <RiskAssessmentForm
          questions={questions}
          maxAllowedScore={config.max_allowed_score}
          studentId={user.id}
          missionId={missionId}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading risk assessment:', error);
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Error Loading Assessment</h1>
          <p className="text-muted-foreground mt-2">
            Failed to load the risk assessment. Please try again or contact support.
          </p>
        </div>
      </div>
    );
  }
}

