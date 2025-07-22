import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { getDocumentById, getDocumentFileUrl } from "@/lib/document-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VerifyDocumentButton } from "./verify-document-button"
import { DeleteDocumentDialog } from "../delete-document-dialog"

export const metadata = {
  title: "Document Details | Desert Skies",
  description: "View document details for Desert Skies Flight School",
}

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const document = await getDocumentById(params.id).catch(() => null)

  if (!document) {
    notFound()
  }

  const documentUrl = await getDocumentFileUrl(document.file_path)

  const documentTypeLabels: Record<string, string> = {
    medical_certificate: "Medical Certificate",
    pilot_license: "Pilot License",
    photo_id: "Photo ID",
    logbook: "Logbook",
    training_record: "Training Record",
    endorsement: "Endorsement",
    certificate: "Certificate",
    other: "Other",
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
          <p className="text-muted-foreground">
            Document for {document.profiles.first_name} {document.profiles.last_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/documents/${params.id}/edit`}>Edit</Link>
          </Button>
          <DeleteDocumentDialog id={params.id} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
            <CardDescription>Information about this document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Document Type</p>
                <p className="text-sm text-muted-foreground">
                  {documentTypeLabels[document.document_type] || document.document_type}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Verification Status</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">{document.is_verified ? "Verified" : "Not Verified"}</p>
                  <VerifyDocumentButton id={params.id} isVerified={document.is_verified} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Upload Date</p>
                <p className="text-sm text-muted-foreground">{formatDate(document.created_at)}</p>
              </div>
              {document.expiration_date && (
                <div>
                  <p className="text-sm font-medium">Expiration Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(document.expiration_date)}</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">{document.description || "No description provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
            <CardDescription>View or download the document</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {document.file_type.startsWith("image/") ? (
              <div className="overflow-hidden rounded-md border">
                <img
                  src={documentUrl || "/placeholder.svg"}
                  alt={document.title}
                  className="max-h-[400px] w-auto object-contain"
                />
              </div>
            ) : document.file_type === "application/pdf" ? (
              <div className="h-[400px] w-full">
                <iframe src={documentUrl} className="h-full w-full rounded-md border" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-16 w-16 text-muted-foreground"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p className="mt-4 text-sm text-muted-foreground">This file type cannot be previewed</p>
                <Button asChild className="mt-4">
                  <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                    Download Document
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
