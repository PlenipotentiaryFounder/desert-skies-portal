'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import type { RiskAssessment } from '@/lib/risk-assessment-service';

interface RiskAssessmentHistoryProps {
  assessments: RiskAssessment[];
  showStudentInfo?: boolean;
}

export function RiskAssessmentHistory({
  assessments,
  showStudentInfo = false
}: RiskAssessmentHistoryProps) {
  if (assessments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment History</CardTitle>
          <CardDescription>No assessments found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No risk assessments have been completed yet.
          </p>
        </CardContent>
      </Card>
    );
  }

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
        <CardTitle>Risk Assessment History</CardTitle>
        <CardDescription>
          {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                {getResultIcon(assessment.result)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {new Date(assessment.completed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {getResultBadge(assessment.result)}
                    {assessment.instructor_override && (
                      <Badge variant="outline">Instructor Override</Badge>
                    )}
                  </div>
                  {showStudentInfo && assessment.student && (
                    <p className="text-sm text-muted-foreground">
                      {assessment.student.first_name} {assessment.student.last_name}
                      {' • '}
                      {assessment.student.email}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>
                      Score: {assessment.total_score}/{assessment.max_allowed_score}
                    </span>
                    {assessment.has_disqualifying_answers && (
                      <span className="text-red-500">• Disqualifying condition</span>
                    )}
                    {assessment.flight_session && (
                      <span>
                        • Flight:{' '}
                        {new Date(
                          assessment.flight_session.scheduled_start
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/student/risk-assessments/${assessment.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

