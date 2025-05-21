"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, X } from "lucide-react"
import { verifyDocument } from "@/lib/document-service"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface VerifyDocumentButtonProps {
  id: string
  isVerified: boolean
}

export function VerifyDocumentButton({ id, isVerified }: VerifyDocumentButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function handleVerify() {
    setIsLoading(true)
    try {
      await verifyDocument(id, !isVerified)
      toast({
        title: isVerified ? "Document unverified" : "Document verified",
        description: isVerified
          ? "The document has been marked as unverified."
          : "The document has been marked as verified.",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update verification status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant={isVerified ? "outline" : "default"} size="sm" onClick={handleVerify} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isVerified ? (
        <X className="mr-1 h-4 w-4" />
      ) : (
        <Check className="mr-1 h-4 w-4" />
      )}
      {isVerified ? "Unverify" : "Verify"}
    </Button>
  )
}
