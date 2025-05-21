"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { verifyDocument } from "@/lib/document-service"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface VerifyDocumentButtonProps {
  id: string
}

export function VerifyDocumentButton({ id }: VerifyDocumentButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function handleVerify() {
    setIsLoading(true)
    try {
      await verifyDocument(id, true)
      toast({
        title: "Document verified",
        description: "The student document has been verified successfully.",
      })
      router.push("/instructor/documents")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleVerify} disabled={isLoading}>
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
      Verify Document
    </Button>
  )
}
