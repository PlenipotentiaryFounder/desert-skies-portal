import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { getDocuments } from "@/lib/document-service"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DocumentsList } from "./documents-list"

export const metadata = {
  title: "Documents | Desert Skies",
  description: "Manage documents for Desert Skies Flight School",
}

export default async function AdminDocumentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage all documents for students and instructors</p>
        </div>
        <Button asChild>
          <Link href="/admin/documents/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Link>
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <DocumentsListWrapper />
      </Suspense>
    </div>
  )
}

async function DocumentsListWrapper() {
  const documents = await getDocuments()
  return <DocumentsList documents={documents} />
}
