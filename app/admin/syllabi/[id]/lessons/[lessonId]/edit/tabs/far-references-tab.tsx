"use client"

import { useState, useTransition } from "react"
import { EnhancedLesson } from "@/lib/enhanced-syllabus-service"
import { addFARReferenceToLesson, removeFARReferenceFromLesson } from "@/lib/enhanced-syllabus-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Scale, Plus, X, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface FARReferencesTabProps {
  lesson: EnhancedLesson
}

export function FARReferencesTab({ lesson }: FARReferencesTabProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [farPart, setFarPart] = useState("")
  const [farSection, setFarSection] = useState("")
  const [farSubsection, setFarSubsection] = useState("")
  const [description, setDescription] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleAdd = () => {
    if (!farPart || !farSection) {
      toast.error("Part and Section are required")
      return
    }

    startTransition(async () => {
      const result = await addFARReferenceToLesson(
        lesson.id,
        farPart,
        farSection,
        farSubsection || undefined,
        description || undefined,
        "required"
      )

      if (result.success) {
        toast.success("FAR reference added")
        setFarPart("")
        setFarSection("")
        setFarSubsection("")
        setDescription("")
        setIsAdding(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to add FAR reference")
      }
    })
  }

  const handleRemove = (referenceId: string) => {
    startTransition(async () => {
      const result = await removeFARReferenceFromLesson(referenceId)
      if (result.success) {
        toast.success("FAR reference removed")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to remove FAR reference")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Current FAR References Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-600" />
            FAA Regulations
          </CardTitle>
          <CardDescription>
            Federal Aviation Regulations referenced in this lesson ({lesson.far_references?.length || 0})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lesson.far_references && lesson.far_references.length > 0 ? (
            <div className="space-y-3">
              {lesson.far_references.map((ref) => (
                <div 
                  key={ref.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono">
                          FAR {ref.far_part}.{ref.far_section}
                          {ref.far_subsection && `(${ref.far_subsection})`}
                        </Badge>
                        {ref.relevance && (
                          <Badge variant="secondary">{ref.relevance}</Badge>
                        )}
                      </div>
                      {ref.description && (
                        <p className="text-sm text-muted-foreground">
                          {ref.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(ref.id)}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No FAR References</p>
              <p className="text-sm mt-1">
                Add relevant Federal Aviation Regulations
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add FAR Reference Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add FAR Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAdding ? (
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Reference
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="far-part">Part *</Label>
                  <Input
                    id="far-part"
                    placeholder="61"
                    value={farPart}
                    onChange={(e) => setFarPart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="far-section">Section *</Label>
                  <Input
                    id="far-section"
                    placeholder="61.103"
                    value={farSection}
                    onChange={(e) => setFarSection(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="far-subsection">Subsection</Label>
                  <Input
                    id="far-subsection"
                    placeholder="(a)(1)"
                    value={farSubsection}
                    onChange={(e) => setFarSubsection(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="far-description">Description</Label>
                <Textarea
                  id="far-description"
                  placeholder="Brief description of what this regulation covers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={isPending}>
                  Add Reference
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAdding(false)
                    setFarPart("")
                    setFarSection("")
                    setFarSubsection("")
                    setDescription("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Common FAR References Help */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-base">Common FAR Parts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p><strong>Part 61:</strong> Certification: Pilots, Flight Instructors, and Ground Instructors</p>
          <p><strong>Part 91:</strong> General Operating and Flight Rules</p>
          <p><strong>Part 67:</strong> Medical Standards and Certification</p>
          <p><strong>Part 43:</strong> Maintenance, Preventive Maintenance, Rebuilding, and Alteration</p>
          <p className="text-xs text-blue-700 mt-3">
            Example: 61.103(a) - Eligibility requirements for Private Pilot certificate
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

