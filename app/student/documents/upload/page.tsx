import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { StudentDocumentUploadForm } from "../student-document-upload-form"

export const metadata = {
  title: "Upload Document | Desert Skies",
  description: "Upload a new document to Desert Skies Flight School",
}

export default async function StudentDocumentUploadPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Document</h1>
        <p className="text-muted-foreground">Upload your certificates, licenses, and other documents</p>
      </div>

      <StudentDocumentUploadForm userId={session.user.id} />
    </div>
  )
}
