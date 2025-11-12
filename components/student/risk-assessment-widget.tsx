import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, AlertCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import { getStudentAssessments } from '@/lib/risk-assessment-service';

interface RiskAssessmentWidgetProps {
  studentId: string;
}

export async function RiskAssessmentWidget({ studentId }: RiskAssessmentWidgetProps) {
  try {
    const assessments = await getStudentAssessments(studentId, 5);

    const recentAssessment = assessments[0];

    const getResultIcon = (result: string) => {
      switch (result) {
        case 'go':
          return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        case 'caution':
          return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        case 'no_go':
          return <AlertCircle className="h-5 w-5 text-red-500" />;
        default:
          return null;
      }
    };

    const getResultBadge = (result: string) => {
      switch (result) {
        case 'go':
          return <Badge variant="default">GO</Badge>;
        case 'caution':
          return <Badge variant="secondary">CAUTION</Badge>;
        case 'no_go':
          return <Badge variant="destructive">NO GO</Badge>;
        default:
          return null;
      }
    };

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pre-Flight Risk Assessment</CardTitle>
              <CardDescription>Required before each flight</CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href="/student/risk-assessment">
                <Plus className="h-4 w-4 mr-2" />
                New Assessment
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                You haven't completed a risk assessment yet.
              </p>
              <Button asChild>
                <Link href="/student/risk-assessment">Take Your First Assessment</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Most Recent Assessment */}
              {recentAssessment && (
                <div className="p-4 border rounded-lg bg-accent/50">
                  <div className="flex items-center gap-3 mb-2">
                    {getResultIcon(recentAssessment.result)}
                    <div className="flex-1">
                      <p className="font-medium">Most Recent Assessment</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(recentAssessment.completed_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {getResultBadge(recentAssessment.result)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Score: {recentAssessment.total_score}/{recentAssessment.max_allowed_score}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/student/risk-assessments/${recentAssessment.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* Assessment History Summary */}
              {assessments.length > 1 && (
                <div>
                  <p className="text-sm font-medium mb-2">Recent History</p>
                  <div className="space-y-2">
                    {assessments.slice(1, 5).map((assessment) => (
                      <div
                        key={assessment.id}
                        className="flex items-center justify-between text-sm p-2 rounded hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {getResultIcon(assessment.result)}
                          <span className="text-muted-foreground">
                            {new Date(assessment.completed_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getResultBadge(assessment.result)}
                          <span className="text-muted-foreground">
                            {assessment.total_score}/{assessment.max_allowed_score}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Reminder */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                  <strong>Safety Reminder:</strong> Complete a new risk assessment before each flight
                  to ensure safe conditions and identify potential hazards.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error('Error loading risk assessment widget:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pre-Flight Risk Assessment</CardTitle>
          <CardDescription>Required before each flight</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">Unable to load assessment data</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/student/risk-assessment">Take Assessment</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
}

