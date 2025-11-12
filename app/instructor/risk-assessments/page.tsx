import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiskAssessmentHistory } from '@/components/shared/risk-assessment-history';
import { getRecentAssessments, getNoGoAssessments } from '@/lib/risk-assessment-service';
import { AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function InstructorRiskAssessmentsPage() {
  const supabase = await createClient(await cookies());

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Check if user is instructor
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', user.id);

  const isInstructor = userRoles?.some(
    (ur: any) => ur.role?.name === 'instructor' || ur.role?.name === 'admin'
  );

  if (!isInstructor) {
    redirect('/student/dashboard');
  }

  try {
    const [recentAssessments, noGoAssessments] = await Promise.all([
      getRecentAssessments(50),
      getNoGoAssessments(20)
    ]);

    const stats = {
      total: recentAssessments.length,
      go: recentAssessments.filter(a => a.result === 'go').length,
      caution: recentAssessments.filter(a => a.result === 'caution').length,
      noGo: recentAssessments.filter(a => a.result === 'no_go').length,
      withOverrides: recentAssessments.filter(a => a.instructor_override).length
    };

    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Risk Assessment Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and review student pre-flight risk assessments
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardDescription>GO</CardDescription>
              <CardTitle className="text-3xl text-green-500">{stats.go}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-yellow-200">
            <CardHeader className="pb-3">
              <CardDescription>CAUTION</CardDescription>
              <CardTitle className="text-3xl text-yellow-500">{stats.caution}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardDescription>NO GO</CardDescription>
              <CardTitle className="text-3xl text-red-500">{stats.noGo}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Overrides</CardDescription>
              <CardTitle className="text-3xl">{stats.withOverrides}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Assessments</TabsTrigger>
            <TabsTrigger value="no-go">
              <AlertTriangle className="h-4 w-4 mr-2" />
              No-Go Assessments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <RiskAssessmentHistory
              assessments={recentAssessments}
              showStudentInfo={true}
            />
          </TabsContent>

          <TabsContent value="no-go">
            {noGoAssessments.length > 0 ? (
              <RiskAssessmentHistory
                assessments={noGoAssessments}
                showStudentInfo={true}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No-Go Assessments</CardTitle>
                  <CardDescription>
                    Assessments where students were advised not to fly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    No no-go assessments found. This is good!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error('Error loading risk assessments:', error);
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p className="text-muted-foreground mt-2">
            Failed to load risk assessments.
          </p>
        </div>
      </div>
    );
  }
}

