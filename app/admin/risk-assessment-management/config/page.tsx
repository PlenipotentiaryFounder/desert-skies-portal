import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ConfigForm } from '@/components/admin/config-form';
import { getActiveConfig } from '@/lib/risk-assessment-service';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ConfigPage() {
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
    const config = await getActiveConfig();

    if (!config) {
      return (
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500">Configuration Not Found</h1>
            <p className="text-muted-foreground mt-2">
              No active risk assessment configuration found.
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

    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/admin/risk-assessment-management">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Management
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Risk Assessment Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Manage system-wide risk assessment settings
          </p>
        </div>

        <ConfigForm config={config} />
      </div>
    );
  } catch (error) {
    console.error('Error loading configuration:', error);
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p className="text-muted-foreground mt-2">
            Failed to load configuration.
          </p>
        </div>
      </div>
    );
  }
}

