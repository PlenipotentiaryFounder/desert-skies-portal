'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { QuestionWithOptions } from '@/lib/risk-assessment-service';

interface RiskAssessmentFormProps {
  questions: QuestionWithOptions[];
  maxAllowedScore: number;
  studentId: string;
  flightSessionId?: string;
  missionId?: string;
}

interface ResponseData {
  question_id: string;
  answer_option_id?: string;
  numeric_value?: number;
}

interface AssessmentResult {
  assessment_id: string;
  total_score: number;
  max_allowed_score: number;
  result: 'go' | 'no_go' | 'caution';
  has_disqualifying_answers: boolean;
  message: string;
}

export function RiskAssessmentForm({
  questions,
  maxAllowedScore,
  studentId,
  flightSessionId,
  missionId
}: RiskAssessmentFormProps) {
  const router = useRouter();
  const [responses, setResponses] = useState<Map<string, ResponseData>>(new Map());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Group questions by category
  const questionsByCategory = questions.reduce((acc, question) => {
    const categoryName = question.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = {
        category: question.category,
        questions: []
      };
    }
    acc[categoryName].questions.push(question);
    return acc;
  }, {} as Record<string, { category: any; questions: QuestionWithOptions[] }>);

  const categoryOrder = Object.values(questionsByCategory).sort(
    (a, b) => a.category.display_order - b.category.display_order
  );

  const handleAnswerChange = (questionId: string, response: ResponseData) => {
    setResponses(prev => {
      const newResponses = new Map(prev);
      newResponses.set(questionId, response);
      return newResponses;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all questions are answered
    const unanswered = questions.filter(q => !responses.has(q.id));
    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/risk-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          flight_session_id: flightSessionId,
          mission_id: missionId,
          responses: Array.from(responses.values()),
          notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit assessment');
      }

      const data = await response.json();
      setResult(data);

      // Scroll to result
      setTimeout(() => {
        document.getElementById('assessment-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div id="assessment-result" className="space-y-6">
        <Card className={
          result.result === 'go' ? 'border-green-500' :
          result.result === 'caution' ? 'border-yellow-500' :
          'border-red-500'
        }>
          <CardHeader>
            <div className="flex items-center gap-3">
              {result.result === 'go' && <CheckCircle2 className="h-8 w-8 text-green-500" />}
              {result.result === 'caution' && <AlertTriangle className="h-8 w-8 text-yellow-500" />}
              {result.result === 'no_go' && <AlertCircle className="h-8 w-8 text-red-500" />}
              <div>
                <CardTitle className="text-2xl">
                  {result.result === 'go' ? 'Safe to Fly' :
                   result.result === 'caution' ? 'Fly with Caution' :
                   'Do Not Fly'}
                </CardTitle>
                <CardDescription>
                  Risk Assessment Completed
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={
              result.result === 'go' ? 'default' :
              result.result === 'caution' ? 'default' :
              'destructive'
            }>
              <AlertDescription className="text-base">
                {result.message}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Your Risk Score</p>
                <p className="text-3xl font-bold">{result.total_score}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Maximum Allowed</p>
                <p className="text-3xl font-bold">{result.max_allowed_score}</p>
              </div>
            </div>

            {result.has_disqualifying_answers && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Disqualifying Condition Detected</AlertTitle>
                <AlertDescription>
                  One or more of your answers indicates a condition that makes it unsafe to fly.
                  This is an automatic NO GO. Please address these conditions before flying.
                </AlertDescription>
              </Alert>
            )}

            {result.result === 'caution' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Consider Mitigation Strategies</AlertTitle>
                <AlertDescription>
                  While not disqualified, your risk score is elevated. Consider:
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>Consulting with your instructor before flight</li>
                    <li>Postponing if conditions worsen</li>
                    <li>Implementing additional safety measures</li>
                    <li>Flying with an instructor for this flight</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => router.push('/student/dashboard')}
                className="flex-1"
              >
                Return to Dashboard
              </Button>
              {result.result === 'no_go' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setResponses(new Map());
                    setNotes('');
                  }}
                  className="flex-1"
                >
                  Retake Assessment
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => router.push(`/student/risk-assessments/${result.assessment_id}`)}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Pre-Flight Risk Assessment</CardTitle>
          <CardDescription>
            Answer all questions honestly to evaluate flight safety. Your score must be {maxAllowedScore} or below to fly.
            Some conditions are automatically disqualifying.
          </CardDescription>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {categoryOrder.map(({ category, questions: categoryQuestions }) => (
        <Card key={category.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {category.name}
            </CardTitle>
            <CardDescription>{category.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {categoryQuestions.map((question, index) => (
              <div key={question.id} className="space-y-3 pb-6 border-b last:border-b-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 space-y-2">
                    <Label className="text-base font-medium leading-relaxed">
                      {question.question_text}
                      {question.is_disqualifying && (
                        <span className="ml-2 text-xs text-red-500 font-normal">
                          (May be disqualifying)
                        </span>
                      )}
                    </Label>
                    {question.help_text && (
                      <p className="text-sm text-muted-foreground">{question.help_text}</p>
                    )}

                    {question.question_type === 'multiple_choice' && question.answer_options && (
                      <RadioGroup
                        onValueChange={(value) =>
                          handleAnswerChange(question.id, {
                            question_id: question.id,
                            answer_option_id: value
                          })
                        }
                        value={responses.get(question.id)?.answer_option_id || ''}
                        className="space-y-2 pt-2"
                      >
                        {question.answer_options.map((option) => (
                          <div
                            key={option.id}
                            className={`flex items-center space-x-2 p-3 rounded-lg border ${
                              option.is_disqualifying
                                ? 'border-red-200 bg-red-50/50'
                                : option.risk_score > 5
                                ? 'border-yellow-200 bg-yellow-50/50'
                                : 'border-border bg-background'
                            } hover:bg-accent transition-colors`}
                          >
                            <RadioGroupItem value={option.id} id={option.id} />
                            <Label
                              htmlFor={option.id}
                              className="flex-1 cursor-pointer font-normal"
                            >
                              {option.answer_text}
                              {option.risk_score > 0 && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ({option.risk_score} pts)
                                </span>
                              )}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {question.question_type === 'numeric' && (
                      <div className="pt-2 space-y-2">
                        <Input
                          type="number"
                          placeholder="Enter value"
                          value={responses.get(question.id)?.numeric_value ?? ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : undefined;
                            if (value !== undefined) {
                              handleAnswerChange(question.id, {
                                question_id: question.id,
                                numeric_value: value
                              });
                            }
                          }}
                          className="max-w-xs"
                        />
                        {question.numeric_ranges && question.numeric_ranges.length > 0 && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p className="font-medium">Score ranges:</p>
                            {question.numeric_ranges.map((range, idx) => (
                              <p key={idx}>
                                {range.min_value !== null && range.max_value !== null
                                  ? `${range.min_value} - ${range.max_value}: `
                                  : range.min_value !== null
                                  ? `${range.min_value}+: `
                                  : range.max_value !== null
                                  ? `up to ${range.max_value}: `
                                  : ''}
                                {range.range_label} ({range.risk_score} pts)
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes (Optional)</CardTitle>
          <CardDescription>
            Add any additional information or context about your assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter any additional notes..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || responses.size < questions.length}
          className="flex-1"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Submitting...' : 'Submit Risk Assessment'}
        </Button>
      </div>

      {responses.size < questions.length && (
        <p className="text-sm text-muted-foreground text-center">
          {questions.length - responses.size} question(s) remaining
        </p>
      )}
    </form>
  );
}

