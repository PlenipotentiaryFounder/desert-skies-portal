"use client"

import dynamic from "next/dynamic"
import React, { useEffect, useState } from "react"
import { getDocuments } from "@/lib/document-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DocumentForm } from "@/app/admin/documents/document-form"

const DocumentsList = dynamic(() => import("@/app/admin/documents/documents-list").then(m => m.DocumentsList))

interface UserDocumentsTabProps {
  userId: string
  userRole: string
}

export default function UserDocumentsTab({ userId, userRole }: UserDocumentsTabProps) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    async function fetchDocs() {
      setLoading(true)
      setError(null)
      try {
        const docs = await getDocuments(userId)
        setDocuments(docs || [])
      } catch (err) {
        setError("Failed to load documents.")
      } finally {
        setLoading(false)
      }
    }
    fetchDocs()
  }, [userId])

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">User Documents</h2>
          <p className="text-muted-foreground text-sm">Upload, search, and manage all documents for this user.</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="w-full md:w-auto" size="lg">
          Upload Document
        </Button>
      </div>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document for User</DialogTitle>
          </DialogHeader>
          <DocumentForm
            users={[{ id: userId, first_name: "", last_name: "", role: userRole }]}
            document={undefined}
            onSuccess={() => {
              setShowUpload(false)
              (async () => {
                setLoading(true)
                try {
                  const docs = await getDocuments(userId)
                  setDocuments(docs || [])
                } finally {
                  setLoading(false)
                }
              })()
            }}
          />
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex items-center justify-center h-[300px]">Loading documents...</div>
      ) : error ? (
        <div className="text-red-600 text-center py-8">{error}</div>
      ) : (
        <DocumentsList documents={documents} />
      )}
    </div>
  )
} 