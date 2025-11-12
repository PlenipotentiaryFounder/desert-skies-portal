import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getCategories,
  getQuestionsWithOptions,
  getActiveConfig
} from '@/lib/risk-assessment-service';
import { Settings, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default async function RiskAssessmentManagementPage() {
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
    const [categories, questions, config] = await Promise.all([
      getCategories(),
      getQuestionsWithOptions(),
      getActiveConfig()
    ]);

    // Group questions by category
    const questionsByCategory = categories.map(category => ({
      category,
      questions: questions.filter(q => q.category_id === category.id)
    }));

    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Risk Assessment Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage questions, answers, scores, and configuration
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/admin/risk-assessment-management/questions/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Configuration Card */}
        {config && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System Configuration
                  </CardTitle>
                  <CardDescription>Active risk assessment configuration</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/risk-assessment-management/config">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Config
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Configuration Name</p>
                  <p className="font-medium">{config.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Allowed Score</p>
                  <p className="font-medium text-2xl">{config.max_allowed_score}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Questions</p>
                  <p className="font-medium text-2xl">{questions.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="font-medium text-2xl">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue={categories[0]?.id || 'all'} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Questions ({questions.length})</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id}>
                {cat.name} ({questionsByCategory.find(qc => qc.category.id === cat.id)?.questions.length || 0})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {questionsByCategory.map(({ category, questions: catQuestions }) => (
              <div key={category.id}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {category.name}
                  <Badge variant="secondary">{catQuestions.length} questions</Badge>
                </h3>
                <div className="space-y-3 mb-6">
                  {catQuestions.map((question, index) => (
                    <QuestionCard key={question.id} question={question} index={index} />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {questionsByCategory.map(({ category, questions: catQuestions }) => (
            <TabsContent key={category.id} value={category.id} className="space-y-3">
              {catQuestions.map((question, index) => (
                <QuestionCard key={question.id} question={question} index={index} />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error('Error loading risk assessment management:', error);
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p className="text-muted-foreground mt-2">
            Failed to load risk assessment management.
          </p>
        </div>
      </div>
    );
  }
}

function QuestionCard({ question, index }: { question: any; index: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">Q{index + 1}</Badge>
              <Badge variant={question.question_type === 'multiple_choice' ? 'default' : 'secondary'}>
                {question.question_type.replace('_', ' ')}
              </Badge>
              {question.is_disqualifying && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Can Disqualify
                </Badge>
              )}
              {!question.is_active && (
                <Badge variant="outline">Inactive</Badge>
              )}
            </div>
            <CardTitle className="text-base">{question.question_text}</CardTitle>
            {question.help_text && (
              <CardDescription className="mt-1">{question.help_text}</CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/risk-assessment-management/questions/${question.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Multiple Choice Answers */}
        {question.question_type === 'multiple_choice' && question.answer_options && (
          <div className="space-y-2">
            <p className="text-sm font-medium mb-2">Answer Options:</p>
            {question.answer_options.map((option: any) => (
              <div
                key={option.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  option.is_disqualifying
                    ? 'border-red-200 bg-red-50 dark:bg-red-950/20'
                    : option.risk_score > 5
                    ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
                    : 'border-border'
                }`}
              >
                <span className="text-sm flex-1">{option.answer_text}</span>
                <div className="flex items-center gap-2">
                  {option.is_disqualifying ? (
                    <Badge variant="destructive">AUTO NO-GO</Badge>
                  ) : (
                    <Badge variant={option.risk_score > 5 ? 'secondary' : 'outline'}>
                      {option.risk_score} points
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Numeric Ranges */}
        {question.question_type === 'numeric' && question.numeric_ranges && (
          <div className="space-y-2">
            <p className="text-sm font-medium mb-2">Score Ranges:</p>
            {question.numeric_ranges.map((range: any) => (
              <div
                key={range.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex-1">
                  <span className="text-sm font-medium">
                    {range.min_value !== null && range.max_value !== null
                      ? `${range.min_value} - ${range.max_value}`
                      : range.min_value !== null
                      ? `${range.min_value}+`
                      : range.max_value !== null
                      ? `up to ${range.max_value}`
                      : 'Any value'}
                  </span>
                  {range.range_label && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({range.range_label})
                    </span>
                  )}
                </div>
                <Badge variant={range.risk_score > 5 ? 'secondary' : 'outline'}>
                  {range.risk_score} points
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

