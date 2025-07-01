import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { DocumentForm } from "../document-form"

export const metadata = {
  title: "Add Document | Desert Skies",
  description: "Add a new document to Desert Skies Flight School",
}

export default async function NewDocumentPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .order("last_name", { ascending: true })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Document</h1>
        <p className="text-muted-foreground">Upload a new document for a student or instructor</p>
      </div>

      <DocumentForm users={users || []} />
    </div>
  )
}
