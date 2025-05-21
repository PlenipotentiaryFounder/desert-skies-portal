"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { FileText, Upload } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DocumentsOverviewProps {
  userId: string
}

interface Document {
  id: string
  title: string
  document_type: string
  file_type: string
  created_at: string
  expiration_date: string | null
  is_verified: boolean
}

export function DocumentsOverview({ userId }: DocumentsOverviewProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const { data } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5)

        setDocuments(data || [])
      } catch (error) {
        console.error("Error fetching documents:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [supabase, userId])

  if (loading) {
    return <div className="flex items-center justify-center h-[300px]">Loading documents...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Recent Documents</h3>
        <Button size="sm" variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <FileText className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">{doc.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(doc.created_at)}
                    {doc.expiration_date && ` · Expires: ${formatDate(doc.expiration_date)}`}
                  </div>
                </div>
              </div>
              <Badge variant={doc.is_verified ? "default" : "outline"}>
                {doc.is_verified ? "Verified" : "Pending"}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <Button variant="link" className="text-xs p-0 h-auto" asChild>
        <a href="/student/documents">View all documents</a>
      </Button>
    </div>
  )
}
