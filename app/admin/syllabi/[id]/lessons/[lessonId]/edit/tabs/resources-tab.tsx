"use client"

import { useState, useTransition } from "react"
import { EnhancedLesson } from "@/lib/enhanced-syllabus-service"
import { addLessonResource, deleteLessonResource } from "@/lib/enhanced-syllabus-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Video, FileText, Plus, X, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ResourcesTabProps {
  lesson: EnhancedLesson
}

export function ResourcesTab({ lesson }: ResourcesTabProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [resourceType, setResourceType] = useState<string>("video")
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [isRequired, setIsRequired] = useState(false)
  const [category, setCategory] = useState("pre_flight")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleAdd = () => {
    if (!title || !url) {
      toast.error("Title and URL are required")
      return
    }

    startTransition(async () => {
      const result = await addLessonResource(lesson.id, {
        title,
        url,
        description: description || undefined,
        resource_type: resourceType as any,
        is_required: isRequired,
        category,
        order_index: (lesson.resources?.length || 0)
      })

      if (result.success) {
        toast.success("Resource added")
        setTitle("")
        setUrl("")
        setDescription("")
        setIsRequired(false)
        setIsAdding(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to add resource")
      }
    })
  }

  const handleRemove = (resourceId: string) => {
    startTransition(async () => {
      const result = await deleteLessonResource(resourceId)
      if (result.success) {
        toast.success("Resource removed")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to remove resource")
      }
    })
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5 text-red-600" />
      case 'pdf':
      case 'document':
        return <FileText className="h-5 w-5 text-blue-600" />
      default:
        return <ExternalLink className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Resources Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-purple-600" />
            Learning Resources
          </CardTitle>
          <CardDescription>
            Study materials for students ({lesson.resource_count || 0} resources)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lesson.resources && lesson.resources.length > 0 ? (
            <div className="space-y-3">
              {lesson.resources.map((resource) => (
                <div 
                  key={resource.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getResourceIcon(resource.resource_type)}
                        <h4 className="font-medium">{resource.title}</h4>
                        {resource.is_required && (
                          <Badge variant="default">Required</Badge>
                        )}
                        {resource.is_verified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {resource.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <Badge variant="secondary">{resource.resource_type}</Badge>
                        {resource.category && (
                          <span className="capitalize">{resource.category.replace('_', ' ')}</span>
                        )}
                        {resource.estimated_study_time && (
                          <span>{resource.estimated_study_time} min</span>
                        )}
                      </div>
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
                      >
                        {resource.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(resource.id)}
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
              <p className="font-medium">No Resources Added</p>
              <p className="text-sm mt-1">
                Add study materials for students to prepare
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Resource Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Learning Resource
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAdding ? (
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resource-type">Resource Type *</Label>
                  <Select value={resourceType} onValueChange={setResourceType}>
                    <SelectTrigger id="resource-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="faa_reference">FAA Reference</SelectItem>
                      <SelectItem value="external_link">External Link</SelectItem>
                      <SelectItem value="chart">Chart</SelectItem>
                      <SelectItem value="checklist">Checklist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre_flight">Pre-Flight</SelectItem>
                      <SelectItem value="post_flight">Post-Flight</SelectItem>
                      <SelectItem value="supplemental">Supplemental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., FAA Traffic Pattern Procedures"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the resource..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is-required">Required Resource</Label>
                  <p className="text-xs text-muted-foreground">
                    Students must review before lesson
                  </p>
                </div>
                <Switch
                  id="is-required"
                  checked={isRequired}
                  onCheckedChange={setIsRequired}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={isPending}>
                  Add Resource
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAdding(false)
                    setTitle("")
                    setUrl("")
                    setDescription("")
                    setIsRequired(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader>
          <CardTitle className="text-base">Resource Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-purple-900">
          <p>
            <strong>Videos:</strong> YouTube links will be verified for availability. 
            Include official FAA videos when possible.
          </p>
          <p>
            <strong>Required Resources:</strong> Mark essential materials as required. 
            Students will be prompted to complete these before the lesson.
          </p>
          <p>
            <strong>Pre-Flight vs Post-Flight:</strong> Pre-flight resources help prepare, 
            post-flight resources reinforce learning after the session.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

