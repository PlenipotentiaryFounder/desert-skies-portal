"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Edit, Sparkles } from "lucide-react"

interface SuggestEditDialogProps {
  lessonId: string
  fieldName: string
  fieldLabel: string
  currentValue: any
  onSuggestionCreated?: () => void
  renderEditField?: (value: any, onChange: (value: any) => void) => React.ReactNode
  children?: React.ReactNode
}

export function SuggestEditDialog({
  lessonId,
  fieldName,
  fieldLabel,
  currentValue,
  onSuggestionCreated,
  renderEditField,
  children
}: SuggestEditDialogProps) {
  const [open, setOpen] = useState(false)
  const [suggestedValue, setSuggestedValue] = useState(currentValue)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!suggestedValue || suggestedValue === currentValue) {
      toast({
        title: "No changes",
        description: "Please make some changes before submitting.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/instructor/suggest-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson_id: lessonId,
          field_name: fieldName,
          current_value: currentValue,
          suggested_value: suggestedValue,
          reason
        })
      })

      if (!response.ok) {
        throw new Error("Failed to submit suggestion")
      }

      toast({
        title: "✨ Suggestion submitted!",
        description: "An admin will review your suggested changes."
      })

      setOpen(false)
      setSuggestedValue(currentValue)
      setReason("")
      
      if (onSuggestionCreated) {
        onSuggestionCreated()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit suggestion. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline">
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Suggest Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Suggest Edit: {fieldLabel}
          </DialogTitle>
          <DialogDescription>
            Propose changes to this lesson. An admin will review and approve your suggestion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Value */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">
              Current Value
            </Label>
            <div className="p-3 rounded-md bg-muted/50 border text-sm">
              {typeof currentValue === 'string' ? (
                <p className="whitespace-pre-wrap">{currentValue || "(Empty)"}</p>
              ) : (
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(currentValue, null, 2)}
                </pre>
              )}
            </div>
          </div>

          {/* Suggested Value */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase">
              Your Suggested Changes *
            </Label>
            {renderEditField ? (
              renderEditField(suggestedValue, setSuggestedValue)
            ) : typeof currentValue === 'string' ? (
              <Textarea
                value={suggestedValue || ""}
                onChange={(e) => setSuggestedValue(e.target.value)}
                placeholder={`Enter new ${fieldLabel.toLowerCase()}...`}
                className="min-h-[150px]"
              />
            ) : (
              <Input
                value={suggestedValue || ""}
                onChange={(e) => setSuggestedValue(e.target.value)}
                placeholder={`Enter new ${fieldLabel.toLowerCase()}...`}
              />
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase">
              Reason for Change (Optional)
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're suggesting this change..."
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Help admins understand your reasoning for better review.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Suggestion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

