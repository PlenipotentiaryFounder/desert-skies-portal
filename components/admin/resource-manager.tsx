"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Video, FileText, Link as LinkIcon, Upload, Plus, X, GripVertical, ExternalLink, File } from "lucide-react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { useToast } from "@/hooks/use-toast"

interface Resource {
  id: string
  title: string
  description?: string
  resource_type: "video" | "link" | "pdf" | "powerpoint" | "markdown"
  url?: string
  file_name?: string
  display_order: number
  is_required?: boolean
}

interface ResourceManagerProps {
  lessonId: string
  resources: Resource[]
  onResourcesChange: (resources: Resource[]) => void
  onSave: () => Promise<void>
}

const RESOURCE_TYPES = [
  { value: "video", label: "Video", icon: Video, description: "YouTube, Vimeo, or direct video link" },
  { value: "link", label: "External Link", icon: ExternalLink, description: "Website or online resource" },
  { value: "pdf", label: "PDF Document", icon: FileText, description: "Upload PDF file" },
  { value: "powerpoint", label: "PowerPoint", icon: File, description: "Upload PPTX file" },
  { value: "markdown", label: "Rich Text", icon: FileText, description: "Embedded content" },
]

export function ResourceManager({
  lessonId,
  resources,
  onResourcesChange,
  onSave
}: ResourceManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    resource_type: "video" as Resource["resource_type"],
    url: "",
    is_required: false
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const getResourceIcon = (type: Resource["resource_type"]) => {
    const resourceType = RESOURCE_TYPES.find(t => t.value === type)
    return resourceType?.icon || FileText
  }

  const handleAddResource = async () => {
    if (!formData.title) {
      toast({
        title: "Error",
        description: "Please enter a title for the resource.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      let url = formData.url
      let fileName = undefined

      // Handle file upload for PDF/PowerPoint
      if (uploadedFile && (formData.resource_type === "pdf" || formData.resource_type === "powerpoint")) {
        const uploadFormData = new FormData()
        uploadFormData.append("file", uploadedFile)
        uploadFormData.append("lessonId", lessonId)
        uploadFormData.append("resourceType", formData.resource_type)

        const response = await fetch("/api/admin/upload-resource", {
          method: "POST",
          body: uploadFormData
        })

        if (!response.ok) {
          throw new Error("Failed to upload file")
        }

        const data = await response.json()
        url = data.url
        fileName = uploadedFile.name
      }

      const newResource: Resource = {
        id: crypto.randomUUID(), // Temporary ID, will be replaced by server
        title: formData.title,
        description: formData.description,
        resource_type: formData.resource_type,
        url,
        file_name: fileName,
        display_order: resources.length,
        is_required: formData.is_required
      }

      onResourcesChange([...resources, newResource])
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        resource_type: "video",
        url: "",
        is_required: false
      })
      setUploadedFile(null)
      setIsDialogOpen(false)
      
      toast({
        title: "Resource added",
        description: "New resource has been added to the lesson."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add resource. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveResource = (resourceId: string) => {
    onResourcesChange(resources.filter(r => r.id !== resourceId))
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(resources)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update display_order
    const updated = items.map((item, index) => ({
      ...item,
      display_order: index
    }))

    onResourcesChange(updated)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave()
      toast({
        title: "Resources saved",
        description: "Lesson resources have been updated successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save resources. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedResourceType = RESOURCE_TYPES.find(t => t.value === formData.resource_type)
  const IconComponent = selectedResourceType?.icon || FileText

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Learning Resources ({resources.length})</h3>
          <p className="text-xs text-muted-foreground">
            Add videos, PDFs, links, and other materials for students
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Learning Resource</DialogTitle>
              <DialogDescription>
                Provide learning materials for students to study
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Resource Type */}
              <div className="space-y-2">
                <Label>Resource Type</Label>
                <Select
                  value={formData.resource_type}
                  onValueChange={(value: any) => setFormData({ ...formData, resource_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Private Pilot Pre-Solo Written Exam"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this resource"
                  className="min-h-[60px]"
                />
              </div>

              {/* URL or File Upload */}
              {formData.resource_type === "pdf" || formData.resource_type === "powerpoint" ? (
                <div className="space-y-2">
                  <Label>Upload File *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept={formData.resource_type === "pdf" ? ".pdf" : ".ppt,.pptx"}
                      onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    />
                    {uploadedFile && (
                      <Badge variant="secondary">
                        {uploadedFile.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.resource_type === "pdf" 
                      ? "Upload a PDF document (max 10MB)"
                      : "Upload a PowerPoint presentation (max 25MB)"}
                  </p>
                </div>
              ) : formData.resource_type === "markdown" ? (
                <div className="space-y-2">
                  <Label>Content *</Label>
                  <Textarea
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="Enter markdown or rich text content here"
                    className="min-h-[200px] font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports markdown formatting
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>URL *</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.resource_type === "video" 
                      ? "YouTube, Vimeo, or direct video link"
                      : "Full URL to the external resource"}
                  </p>
                </div>
              )}

              {/* Required Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="required" className="font-normal cursor-pointer">
                  Mark as required reading/viewing
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddResource} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Resource"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resources List */}
      {resources.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="resources">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {resources.map((resource, index) => {
                  const ResourceIcon = getResourceIcon(resource.resource_type)
                  return (
                    <Draggable key={resource.id} draggableId={resource.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="relative"
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              {/* Drag Handle */}
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing pt-1">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>

                              {/* Icon */}
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                                <ResourceIcon className="h-5 w-5" />
                              </div>

                              {/* Resource Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-sm">{resource.title}</h4>
                                      {resource.is_required && (
                                        <Badge variant="destructive" className="text-xs">Required</Badge>
                                      )}
                                      <Badge variant="secondary" className="text-xs capitalize">
                                        {resource.resource_type}
                                      </Badge>
                                    </div>
                                    {resource.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {resource.description}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveResource(resource.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* URL/File Info */}
                                {resource.url && (
                                  <div className="flex items-center gap-2 mt-2">
                                    {resource.resource_type !== "markdown" && (
                                      <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        {resource.file_name || "View Resource"}
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-sm font-semibold mb-1">No Resources Yet</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Add learning materials to help students prepare for this lesson
            </p>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Resource
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {resources.length > 0 && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Resources"}
          </Button>
        </div>
      )}
    </div>
  )
}

