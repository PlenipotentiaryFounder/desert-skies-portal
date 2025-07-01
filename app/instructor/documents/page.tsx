import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { InstructorDocumentsList } from "./instructor-documents-list"

export const metadata = {
  title: "Documents | Desert Skies",
  description: "Manage documents for Desert Skies Flight School",
}

export default async function InstructorDocumentsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage your documents and view student documents</p>
        </div>
        <Button asChild>
          <Link href="/instructor/documents/upload">
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Link>
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <InstructorDocumentsListWrapper instructorId={session.user.id} />
      </Suspense>
    </div>
  )
}

async function InstructorDocumentsListWrapper({ instructorId }: { instructorId: string }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Get instructor's students
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("student_id")
    .eq("instructor_id", instructorId)
    .eq("status", "active")

  const studentIds = enrollments?.map((e) => e.student_id) || []

  // Get instructor's documents
  const { data: instructorDocuments } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", instructorId)
    .order("created_at", { ascending: false })

  // Get students' documents
  let studentDocuments: any[] = []
  if (studentIds.length > 0) {
    const { data } = await supabase
      .from("documents")
      .select("*, profiles:user_id(first_name, last_name)")
      .in("user_id", studentIds)
      .order("created_at", { ascending: false })

    studentDocuments = data || []
  }

  return <InstructorDocumentsList instructorDocuments={instructorDocuments || []} studentDocuments={studentDocuments} />
}
