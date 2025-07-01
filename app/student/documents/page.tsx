import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StudentDocumentsList } from "./student-documents-list"

export const metadata = {
  title: "My Documents | Desert Skies",
  description: "Manage your documents for Desert Skies Flight School",
}

export default async function StudentDocumentsPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
          <p className="text-muted-foreground">Manage your certificates, licenses, and other documents</p>
        </div>
        <Button asChild>
          <Link href="/student/documents/upload">
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Link>
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <StudentDocumentsListWrapper userId={session.user.id} />
      </Suspense>
    </div>
  )
}

async function StudentDocumentsListWrapper({ userId }: { userId: string }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return <StudentDocumentsList documents={documents || []} />
}
