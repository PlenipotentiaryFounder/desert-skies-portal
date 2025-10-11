"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, FileText, Search } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StudentDocumentsListProps {
  documents: any[]
}

export function StudentDocumentsList({ documents }: StudentDocumentsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [documentType, setDocumentType] = useState("all")

  const filteredDocuments = documents.filter((doc) => {
    // Filter by search query
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))

    // Filter by document type
    const matchesType = documentType === "all" || doc.document_type === documentType

    return matchesSearch && matchesType
  })

  // TODO: Fetch document types from database or configuration
  const documentTypeOptions = [
    { value: "all", label: "All Types" },
    { value: "medical_certificate", label: "Medical Certificate" },
    { value: "pilot_license", label: "Pilot License" },
    { value: "photo_id", label: "Photo ID" },
    { value: "logbook", label: "Logbook" },
    { value: "training_record", label: "Training Record" },
    { value: "endorsement", label: "Endorsement" },
    { value: "certificate", label: "Certificate" },
    { value: "other", label: "Other" },
  ]

  function getDocumentTypeLabel(type: string) {
    const option = documentTypeOptions.find((opt) => opt.value === type)
    return option ? option.label : type
  }

  // Group documents by verification status
  const verifiedDocuments = filteredDocuments.filter((doc) => doc.is_verified)
  const pendingDocuments = filteredDocuments.filter((doc) => !doc.is_verified)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Documents</CardTitle>
          <CardDescription>Search and filter your documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or description..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Document Types</SelectLabel>
                    {documentTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Documents ({filteredDocuments.length})</TabsTrigger>
          <TabsTrigger value="verified">Verified ({verifiedDocuments.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingDocuments.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <DocumentsGrid documents={filteredDocuments} getDocumentTypeLabel={getDocumentTypeLabel} />
        </TabsContent>
        <TabsContent value="verified">
          <DocumentsGrid documents={verifiedDocuments} getDocumentTypeLabel={getDocumentTypeLabel} />
        </TabsContent>
        <TabsContent value="pending">
          <DocumentsGrid documents={pendingDocuments} getDocumentTypeLabel={getDocumentTypeLabel} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DocumentsGrid({
  documents,
  getDocumentTypeLabel,
}: {
  documents: any[]
  getDocumentTypeLabel: (type: string) => string
}) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No documents found</h3>
        <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => (
        <Card key={doc.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="line-clamp-1">{doc.title}</CardTitle>
              <Badge variant={doc.is_verified ? "default" : "outline"}>
                {doc.is_verified ? "Verified" : "Pending"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{getDocumentTypeLabel(doc.document_type)}</span>
              </div>
              {doc.expiration_date && (
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Expires: {formatDate(doc.expiration_date)}</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <span className="text-muted-foreground">Uploaded: {formatDate(doc.created_at)}</span>
              </div>
              {doc.description && <p className="text-sm text-muted-foreground line-clamp-2">{doc.description}</p>}
            </div>
          </CardContent>
          <div className="flex items-center justify-between border-t p-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/student/documents/${doc.id}`}>View Document</Link>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
