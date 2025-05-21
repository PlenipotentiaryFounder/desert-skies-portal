"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, Check, FileText, Search } from "lucide-react"
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

interface InstructorDocumentsListProps {
  instructorDocuments: any[]
  studentDocuments: any[]
}

export function InstructorDocumentsList({ instructorDocuments, studentDocuments }: InstructorDocumentsListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [documentType, setDocumentType] = useState("all")
  const [verificationStatus, setVerificationStatus] = useState("all")

  const filterDocuments = (documents: any[]) => {
    return documents.filter((doc) => {
      // Filter by search query
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.profiles &&
          `${doc.profiles.first_name} ${doc.profiles.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()))

      // Filter by document type
      const matchesType = documentType === "all" || doc.document_type === documentType

      // Filter by verification status
      const matchesVerification =
        verificationStatus === "all" ||
        (verificationStatus === "verified" && doc.is_verified) ||
        (verificationStatus === "unverified" && !doc.is_verified)

      return matchesSearch && matchesType && matchesVerification
    })
  }

  const filteredInstructorDocuments = filterDocuments(instructorDocuments)
  const filteredStudentDocuments = filterDocuments(studentDocuments)

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

  const verificationOptions = [
    { value: "all", label: "All Statuses" },
    { value: "verified", label: "Verified" },
    { value: "unverified", label: "Unverified" },
  ]

  function getDocumentTypeLabel(type: string) {
    const option = documentTypeOptions.find((opt) => opt.value === type)
    return option ? option.label : type
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Documents</CardTitle>
          <CardDescription>Search and filter documents by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, description, or student..."
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Status</label>
              <Select value={verificationStatus} onValueChange={setVerificationStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select verification status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Verification Status</SelectLabel>
                    {verificationOptions.map((option) => (
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

      <Tabs defaultValue="my-documents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-documents">My Documents ({filteredInstructorDocuments.length})</TabsTrigger>
          <TabsTrigger value="student-documents">Student Documents ({filteredStudentDocuments.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="my-documents">
          <DocumentsGrid
            documents={filteredInstructorDocuments}
            getDocumentTypeLabel={getDocumentTypeLabel}
            basePath="/instructor/documents"
            showUser={false}
          />
        </TabsContent>
        <TabsContent value="student-documents">
          <DocumentsGrid
            documents={filteredStudentDocuments}
            getDocumentTypeLabel={getDocumentTypeLabel}
            basePath="/instructor/documents/student"
            showUser={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DocumentsGrid({
  documents,
  getDocumentTypeLabel,
  basePath,
  showUser,
}: {
  documents: any[]
  getDocumentTypeLabel: (type: string) => string
  basePath: string
  showUser: boolean
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
              <div>
                <CardTitle className="line-clamp-1">{doc.title}</CardTitle>
                {showUser && doc.profiles && (
                  <CardDescription className="line-clamp-1">
                    {doc.profiles.first_name} {doc.profiles.last_name}
                  </CardDescription>
                )}
              </div>
              <Badge variant={doc.is_verified ? "default" : "outline"}>
                {doc.is_verified ? "Verified" : "Unverified"}
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
            </div>
          </CardContent>
          <div className="flex items-center justify-between border-t p-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`${basePath}/${doc.id}`}>View Details</Link>
            </Button>
            {!doc.is_verified && showUser && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`${basePath}/${doc.id}/verify`}>
                  <Check className="mr-2 h-4 w-4" />
                  Verify
                </Link>
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
