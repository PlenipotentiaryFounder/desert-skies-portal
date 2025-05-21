import { notFound, redirect } from "next/navigation"
import { getDocumentById } from "@/lib/document-service"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DocumentForm } from "../../document-form"

export const metadata = {
  title: "Edit Document | Desert Skies",
  description: "Edit document details for Desert Skies Flight School",
}

export default async function EditDocumentPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const document = await getDocumentById(params.id).catch(() => null)

  if (!document) {
    notFound()
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .order("last_name", { ascending: true })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Document</h1>
        <p className="text-muted-foreground">Update document details</p>
      </div>

      <DocumentForm users={users || []} document={document} />
    </div>
  )
}
