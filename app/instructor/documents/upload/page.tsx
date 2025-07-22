import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { InstructorDocumentUploadForm } from "../instructor-document-upload-form"

export const metadata = {
  title: "Upload Document | Desert Skies",
  description: "Upload a new document to Desert Skies Flight School",
}

export default async function InstructorDocumentUploadPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Document</h1>
        <p className="text-muted-foreground">Upload your certificates, licenses, and other documents</p>
      </div>

      <InstructorDocumentUploadForm userId={user.id} />
    </div>
  )
}
