"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Target, Plus, X, Search, GripVertical } from "lucide-react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { useToast } from "@/hooks/use-toast"

interface Maneuver {
  id: string
  name: string
  description?: string
  category?: string
  primary_acs_task_code?: string
}

interface LessonManeuver extends Maneuver {
  is_required: boolean
  target_proficiency?: number
  emphasis_level?: "introduction" | "practice" | "review" | "mastery"
  is_introduction?: boolean
  instructor_notes?: string
  display_order: number
}

interface ManeuverSelectorProps {
  lessonId: string
  selectedManeuvers: LessonManeuver[]
  onManeuversChange: (maneuvers: LessonManeuver[]) => void
  onSave: () => Promise<void>
}

export function ManeuverSelector({
  lessonId,
  selectedManeuvers,
  onManeuversChange,
  onSave
}: ManeuverSelectorProps) {
  const [allManeuvers, setAllManeuvers] = useState<Maneuver[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingManeuver, setEditingManeuver] = useState<LessonManeuver | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Fetch all available maneuvers
  useEffect(() => {
    fetch('/api/admin/maneuvers')
      .then(r => r.json())
      .then(data => setAllManeuvers(data.maneuvers || []))
      .catch(err => console.error('Failed to load maneuvers:', err))
  }, [])

  const filteredManeuvers = allManeuvers.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddManeuver = (maneuver: Maneuver) => {
    const newManeuver: LessonManeuver = {
      ...maneuver,
      is_required: true,
      target_proficiency: 3,
      emphasis_level: "practice",
      is_introduction: false,
      instructor_notes: "",
      display_order: selectedManeuvers.length
    }
    onManeuversChange([...selectedManeuvers, newManeuver])
    setIsDialogOpen(false)
  }

  const handleRemoveManeuver = (maneuverId: string) => {
    onManeuversChange(selectedManeuvers.filter(m => m.id !== maneuverId))
  }

  const handleUpdateManeuver = (maneuverId: string, updates: Partial<LessonManeuver>) => {
    onManeuversChange(
      selectedManeuvers.map(m => 
        m.id === maneuverId ? { ...m, ...updates } : m
      )
    )
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(selectedManeuvers)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update display_order
    const updated = items.map((item, index) => ({
      ...item,
      display_order: index
    }))

    onManeuversChange(updated)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave()
      toast({
        title: "Maneuvers saved",
        description: "Lesson maneuvers have been updated successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save maneuvers. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Maneuvers ({selectedManeuvers.length})</h3>
          <p className="text-xs text-muted-foreground">
            Configure maneuvers students will practice in this lesson
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Maneuver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Maneuver to Lesson</DialogTitle>
              <DialogDescription>
                Select a maneuver from the available list
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search maneuvers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredManeuvers.map(maneuver => {
                    const isSelected = selectedManeuvers.some(m => m.id === maneuver.id)
                    return (
                      <div
                        key={maneuver.id}
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{maneuver.name}</h4>
                            {maneuver.category && (
                              <Badge variant="outline" className="text-xs">
                                {maneuver.category}
                              </Badge>
                            )}
                            {maneuver.primary_acs_task_code && (
                              <Badge variant="secondary" className="text-xs font-mono">
                                {maneuver.primary_acs_task_code}
                              </Badge>
                            )}
                          </div>
                          {maneuver.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {maneuver.description}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddManeuver(maneuver)}
                          disabled={isSelected}
                        >
                          {isSelected ? "Added" : "Add"}
                        </Button>
                      </div>
                    )
                  })}
                  {filteredManeuvers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No maneuvers found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selected Maneuvers List */}
      {selectedManeuvers.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="maneuvers">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {selectedManeuvers.map((maneuver, index) => (
                  <Draggable key={maneuver.id} draggableId={maneuver.id} index={index}>
                    {(provided) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="relative"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            {/* Drag Handle */}
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing pt-1">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>

                            {/* Maneuver Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">{maneuver.name}</h4>
                                {maneuver.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {maneuver.category}
                                  </Badge>
                                )}
                              </div>

                              {/* Configuration Grid */}
                              <div className="grid grid-cols-2 gap-3 mt-3">
                                {/* Required Checkbox */}
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`required-${maneuver.id}`}
                                    checked={maneuver.is_required}
                                    onCheckedChange={(checked) => 
                                      handleUpdateManeuver(maneuver.id, { is_required: checked as boolean })
                                    }
                                  />
                                  <Label htmlFor={`required-${maneuver.id}`} className="text-xs font-normal cursor-pointer">
                                    Required
                                  </Label>
                                </div>

                                {/* First Exposure Checkbox */}
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`intro-${maneuver.id}`}
                                    checked={maneuver.is_introduction}
                                    onCheckedChange={(checked) => 
                                      handleUpdateManeuver(maneuver.id, { is_introduction: checked as boolean })
                                    }
                                  />
                                  <Label htmlFor={`intro-${maneuver.id}`} className="text-xs font-normal cursor-pointer">
                                    First Exposure
                                  </Label>
                                </div>

                                {/* Target Proficiency */}
                                <div className="space-y-1">
                                  <Label className="text-xs">Target Proficiency</Label>
                                  <Select
                                    value={String(maneuver.target_proficiency || 3)}
                                    onValueChange={(value) => 
                                      handleUpdateManeuver(maneuver.id, { target_proficiency: parseInt(value) })
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1">1 - Beginner</SelectItem>
                                      <SelectItem value="2">2 - Developing</SelectItem>
                                      <SelectItem value="3">3 - Proficient</SelectItem>
                                      <SelectItem value="4">4 - Advanced</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Emphasis Level */}
                                <div className="space-y-1">
                                  <Label className="text-xs">Emphasis</Label>
                                  <Select
                                    value={maneuver.emphasis_level || "practice"}
                                    onValueChange={(value) => 
                                      handleUpdateManeuver(maneuver.id, { emphasis_level: value as any })
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="introduction">Introduction</SelectItem>
                                      <SelectItem value="practice">Practice</SelectItem>
                                      <SelectItem value="review">Review</SelectItem>
                                      <SelectItem value="mastery">Mastery</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Instructor Notes */}
                              <div className="space-y-1 mt-3">
                                <Label className="text-xs">Instructor Notes (for this lesson)</Label>
                                <Textarea
                                  value={maneuver.instructor_notes || ""}
                                  onChange={(e) => 
                                    handleUpdateManeuver(maneuver.id, { instructor_notes: e.target.value })
                                  }
                                  placeholder="Special tips or considerations for this maneuver in this lesson"
                                  className="min-h-[60px] text-xs"
                                />
                              </div>
                            </div>

                            {/* Remove Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveManeuver(maneuver.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-sm font-semibold mb-1">No Maneuvers Selected</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Add maneuvers that students will practice in this lesson
            </p>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Maneuver
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {selectedManeuvers.length > 0 && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Maneuvers"}
          </Button>
        </div>
      )}
    </div>
  )
}

