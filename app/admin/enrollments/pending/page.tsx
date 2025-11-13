import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { PendingEnrollmentApprovalCard } from '@/components/admin/pending-enrollment-approval-card'

export const metadata = {
  title: 'Pending Enrollments | Admin Dashboard',
  description: 'Review and approve student enrollments'
}

async function getPendingEnrollments() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase
    .from('student_enrollments')
    .select(`
      *,
      student:profiles!student_enrollments_student_id_fkey(
        id,
        first_name,
        last_name,
        email,
        phone_number,
        created_at
      ),
      instructor:profiles!student_enrollments_instructor_id_fkey(
        id,
        first_name,
        last_name,
        email
      ),
      syllabus:syllabi(
        id,
        name,
        description,
        category
      ),
      onboarding:student_onboarding(
        desired_program,
        pilot_certificate_type,
        medical_certificate_class,
        tsa_citizenship_status,
        uploaded_documents,
        completed_at
      )
    `)
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending enrollments:', error)
    return []
  }

  return data || []
}

export default async function PendingEnrollmentsPage() {
  const pendingEnrollments = await getPendingEnrollments()

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pending Enrollments</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve student enrollments awaiting approval
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          {pendingEnrollments.length} Pending
        </Badge>
      </div>

      {pendingEnrollments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                There are no pending enrollments to review at this time.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingEnrollments.map((enrollment: any) => (
            <Suspense key={enrollment.id} fallback={<div>Loading...</div>}>
              <PendingEnrollmentApprovalCard enrollment={enrollment} />
            </Suspense>
          ))}
        </div>
      )}
    </div>
  )
}

