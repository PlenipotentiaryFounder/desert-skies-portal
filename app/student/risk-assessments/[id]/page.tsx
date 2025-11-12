import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  getAssessment,
  getAssessmentResponses
} from '@/lib/risk-assessment-service';

export default async function RiskAssessmentDetailPage({
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

  try {
    const [assessment, responses] = await Promise.all([
      getAssessment(params.id),
      getAssessmentResponses(params.id)
    ]);

    if (!assessment) {
      return (
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Assessment Not Found</h1>
            <p className="text-muted-foreground mt-2">
              The requested assessment could not be found.
            </p>
            <Button asChild className="mt-4">
              <Link href="/student/dashboard">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      );
    }

    // Check authorization
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id);

    const isInstructor = userRoles?.some(
      (ur: any) => ur.role?.name === 'instructor' || ur.role?.name === 'admin'
    );

    if (assessment.student_id !== user.id && !isInstructor) {
      redirect('/student/dashboard');
    }

    const resultConfig = {
      go: {
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-500',
        title: 'Safe to Fly',
        variant: 'default' as const
      },
      caution: {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-500',
        title: 'Fly with Caution',
        variant: 'default' as const
      },
      no_go: {
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500',
        title: 'Do Not Fly',
        variant: 'destructive' as const
      }
    };

    const config = resultConfig[assessment.result];
    const Icon = config.icon;

    // Group responses by category
    const responsesByCategory = responses.reduce((acc, response) => {
      const category = response.question?.category_id || 'Unknown';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(response);
      return acc;
    }, {} as Record<string, typeof responses>);

    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/student/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Result Summary */}
          <Card className={config.borderColor}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Icon className={`h-8 w-8 ${config.color}`} />
                <div className="flex-1">
                  <CardTitle className="text-2xl">{config.title}</CardTitle>
                  <CardDescription>
                    Completed {new Date(assessment.completed_at).toLocaleString()}
                  </CardDescription>
                </div>
                <Badge
                  variant={assessment.result === 'go' ? 'default' : 'destructive'}
                  className="text-sm"
                >
                  {assessment.result.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Risk Score</p>
                  <p className="text-3xl font-bold">{assessment.total_score}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Maximum Allowed</p>
                  <p className="text-3xl font-bold">{assessment.max_allowed_score}</p>
                </div>
              </div>

              {assessment.has_disqualifying_answers && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Disqualifying Condition</AlertTitle>
                  <AlertDescription>
                    This assessment contains one or more disqualifying answers.
                  </AlertDescription>
                </Alert>
              )}

              {assessment.instructor_override && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Instructor Override Applied</AlertTitle>
                  <AlertDescription>
                    An instructor has reviewed and modified this assessment.
                    <br />
                    <strong>Reason:</strong> {assessment.instructor_override_reason}
                    <br />
                    <strong>Override Date:</strong>{' '}
                    {assessment.instructor_override_at &&
                      new Date(assessment.instructor_override_at).toLocaleString()}
                  </AlertDescription>
                </Alert>
              )}

              {assessment.notes && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Student Notes:</p>
                  <p className="text-sm">{assessment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Responses */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Responses</CardTitle>
              <CardDescription>
                Your answers and assigned risk scores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {responses.map((response, index) => (
                <div
                  key={response.id}
                  className={`p-4 rounded-lg border ${
                    response.is_disqualifying
                      ? 'border-red-200 bg-red-50'
                      : response.risk_score > 5
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-border bg-background'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <p className="font-medium">{response.question?.question_text}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm">
                          <strong>Your Answer:</strong>{' '}
                          {response.answer_option?.answer_text ||
                            `${response.numeric_value}`}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              response.is_disqualifying
                                ? 'destructive'
                                : response.risk_score > 5
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {response.is_disqualifying
                              ? 'DISQUALIFYING'
                              : `${response.risk_score} points`}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/student/risk-assessment">Take New Assessment</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/student/dashboard">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading assessment:', error);
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p className="text-muted-foreground mt-2">
            Failed to load assessment details.
          </p>
          <Button asChild className="mt-4">
            <Link href="/student/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }
}

