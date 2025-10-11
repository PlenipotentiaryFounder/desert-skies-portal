"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult
} from "@hello-pangea/dnd"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Plus,
  MoreVertical,
  Clock,
  BookOpen,
  Plane,
  Monitor,
  Award,
  Target,
  Settings,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap
} from "lucide-react"
import type { SyllabusLesson } from "@/lib/syllabus-service"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

interface LessonWithManeuvers extends SyllabusLesson {
  maneuvers?: Array<{
    id: string
    name: string
    is_required: boolean
    instructor_notes?: string
  }>
  is_active?: boolean
}

interface EnhancedLessonManagerProps {
  lessons: LessonWithManeuvers[]
  syllabusId: string
  onLessonsReorder: (lessons: LessonWithManeuvers[]) => Promise<void>
  onLessonUpdate: (lessonId: string, updates: Partial<LessonWithManeuvers>) => Promise<void>
  onLessonDuplicate: (lessonId: string) => Promise<void>
  onLessonDelete: (lessonId: string) => Promise<void>
  onLessonToggleActive: (lessonId: string, isActive: boolean) => Promise<void>
}

export function EnhancedLessonManager({
  lessons: initialLessons,
  syllabusId,
  onLessonsReorder,
  onLessonUpdate,
  onLessonDuplicate,
  onLessonDelete,
  onLessonToggleActive
}: EnhancedLessonManagerProps) {
  const [lessons, setLessons] = useState<LessonWithManeuvers[]>(initialLessons)
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())
  const [editingLesson, setEditingLesson] = useState<LessonWithManeuvers | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [isReordering, setIsReordering] = useState(false)
  const { toast } = useToast()
  const [allManeuvers, setAllManeuvers] = useState<any[]>([])
  const [maneuverSearch, setManeuverSearch] = useState("")
  const [editingManeuvers, setEditingManeuvers] = useState<{[key: string]: any[]}>({})

  useEffect(() => {
    setLessons(initialLessons)
  }, [initialLessons])

  // Fetch all maneuvers for the syllabus
  useEffect(() => {
    fetch(`/api/admin/syllabus-maneuvers?syllabusId=${syllabusId}`)
      .then(r => r.json())
      .then(data => setAllManeuvers(data.maneuvers || []))
  }, [syllabusId])

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lesson.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === "all" || lesson.lesson_type === filterType
    return matchesSearch && matchesFilter
  })

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(lessons)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order_index for all lessons
    const updatedLessons = items.map((lesson, index) => ({
      ...lesson,
      order_index: index
    }))

    setLessons(updatedLessons)
    setIsReordering(true)

    try {
      await onLessonsReorder(updatedLessons)
      toast({
        title: "Lessons reordered",
        description: "Lesson order has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reorder lessons. Please try again.",
        variant: "destructive",
      })
      // Revert on error
      setLessons(initialLessons)
    } finally {
      setIsReordering(false)
    }
  }

  const toggleExpanded = (lessonId: string) => {
    const newExpanded = new Set(expandedLessons)
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId)
    } else {
      newExpanded.add(lessonId)
    }
    setExpandedLessons(newExpanded)
  }

  const handleQuickEdit = async (lessonId: string, field: string, value: any) => {
    try {
      await onLessonUpdate(lessonId, { [field]: value })
      setLessons(prev => prev.map(lesson => 
        lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
      ))
      toast({
        title: "Lesson updated",
        description: `${field} has been updated successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lesson. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Helper function to get current maneuvers for a lesson
  const getCurrentManeuvers = (lessonId: string) => {
    return editingManeuvers[lessonId] || lessons.find(l => l.id === lessonId)?.maneuvers || []
  }

  const handleManeuverToggle = (lessonId: string, maneuver: any) => {
    // Get current maneuvers (either from editing state or lesson state)
    const currentManeuvers = getCurrentManeuvers(lessonId)
    const exists = currentManeuvers.find(m => m.id === maneuver.id)
    let updatedManeuvers
    
    if (exists) {
      updatedManeuvers = currentManeuvers.filter(m => m.id !== maneuver.id)
    } else {
      updatedManeuvers = [...currentManeuvers, { ...maneuver, is_required: true }]
    }
    
    setEditingManeuvers(prev => ({ ...prev, [lessonId]: updatedManeuvers }))
  }

  const handleManeuverChange = (lessonId: string, maneuverId: string, field: string, value: any) => {
    // Get current maneuvers (either from editing state or lesson state)
    const currentManeuvers = getCurrentManeuvers(lessonId)
    const updatedManeuvers = currentManeuvers.map(m => 
      m.id === maneuverId ? { ...m, [field]: value } : m
    )
    setEditingManeuvers(prev => ({ ...prev, [lessonId]: updatedManeuvers }))
  }

  const saveManeuvers = async (lessonId: string) => {
    const maneuvers = editingManeuvers[lessonId] || []
    try {
      const response = await fetch('/api/admin/syllabus-maneuvers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          maneuvers
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save maneuvers')
      }

      // Update the lesson in the local state
      setLessons(prev => prev.map(lesson => 
        lesson.id === lessonId 
          ? { ...lesson, maneuvers: maneuvers.map(m => ({ ...m, is_required: m.is_required || true })) }
          : lesson
      ))

      // Clear editing state
      setEditingManeuvers(prev => ({ ...prev, [lessonId]: [] }))
      
      toast({
        title: "Maneuvers updated",
        description: "Lesson maneuvers have been saved successfully.",
      })
    } catch (error) {
      console.error('Error saving maneuvers:', error)
      toast({
        title: "Error",
        description: "Failed to save maneuvers. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case "Flight": return <Plane className="w-4 h-4" />
      case "Ground": return <BookOpen className="w-4 h-4" />
      case "Simulator": return <Monitor className="w-4 h-4" />
      case "Checkride": return <Award className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  const getLessonTypeColor = (type: string) => {
    switch (type) {
      case "Flight": return "bg-blue-100 text-blue-800 border-blue-200"
      case "Ground": return "bg-green-100 text-green-800 border-green-200"
      case "Simulator": return "bg-purple-100 text-purple-800 border-purple-200"
      case "Checkride": return "bg-orange-100 text-orange-800 border-orange-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex flex-1 gap-4 items-center">
          <div className="flex-1">
            <Input
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Flight">Flight</SelectItem>
              <SelectItem value="Ground">Ground</SelectItem>
              <SelectItem value="Simulator">Simulator</SelectItem>
              <SelectItem value="Checkride">Checkride</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (expandedLessons.size === lessons.length) {
                setExpandedLessons(new Set())
              } else {
                setExpandedLessons(new Set(lessons.map(l => l.id)))
              }
            }}
          >
            {expandedLessons.size === lessons.length ? "Collapse All" : "Expand All"}
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Lesson
          </Button>
        </div>
      </div>

      {/* Lesson Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="lessons">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={cn(
                "space-y-4",
                snapshot.isDraggingOver && "bg-blue-50 rounded-lg p-2"
              )}
            >
              {filteredLessons.map((lesson, index) => (
                <Draggable key={lesson.id} draggableId={lesson.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn(
                        "bg-white rounded-lg border shadow-sm transition-all duration-200",
                        snapshot.isDragging && "shadow-lg ring-2 ring-blue-200",
                        lesson.is_active === false && "opacity-60"
                      )}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          {/* Drag Handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab hover:cursor-grabbing text-aviation-sunset-300 hover:text-aviation-sunset-200"
                          >
                            <GripVertical className="w-5 h-5" />
                          </div>

                          {/* Lesson Number */}
                          <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">
                            {lesson.order_index + 1}
                          </div>

                          {/* Title and Status */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{lesson.title}</h3>
                              <Badge className={cn("text-xs", getLessonTypeColor(lesson.lesson_type))}>
                                {getLessonTypeIcon(lesson.lesson_type)}
                                <span className="ml-1">{lesson.lesson_type}</span>
                              </Badge>
                              {lesson.is_active === false && (
                                <Badge variant="secondary" className="text-xs">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-aviation-sunset-200 line-clamp-1">{lesson.description}</p>
                          </div>

                          {/* Quick Stats */}
                          <div className="flex items-center gap-4 text-sm text-aviation-sunset-300">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {lesson.estimated_hours}h
                            </div>
                            {lesson.maneuvers && (
                              <div className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                {lesson.maneuvers.length}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(lesson.id)}
                            >
                              {expandedLessons.has(lesson.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingLesson(lesson)}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Quick Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onLessonDuplicate(lesson.id)}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => onLessonToggleActive(lesson.id, !lesson.is_active)}
                                >
                                  {lesson.is_active === false ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      Activate
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Deactivate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => onLessonDelete(lesson.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>

                      {/* Expanded Content */}
                      {expandedLessons.has(lesson.id) && (
                        <CardContent className="pt-0">
                          <Tabs defaultValue="details" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="details">Details</TabsTrigger>
                              <TabsTrigger value="maneuvers">
                                Maneuvers ({lesson.maneuvers?.length || 0})
                              </TabsTrigger>
                              <TabsTrigger value="settings">Settings</TabsTrigger>
                            </TabsList>

                            <TabsContent value="details" className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Description</Label>
                                  <p className="text-sm text-aviation-sunset-200 mt-1">{lesson.description}</p>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium">Estimated Hours:</span>
                                    <span className="text-sm">{lesson.estimated_hours}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium">Lesson Type:</span>
                                    <span className="text-sm">{lesson.lesson_type}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium">Order:</span>
                                    <span className="text-sm">{lesson.order_index + 1}</span>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="maneuvers" className="space-y-4">
                              <div className="space-y-4">
                                {/* Search and select maneuvers */}
                                <div>
                                  <Input
                                    placeholder="Search maneuvers..."
                                    value={maneuverSearch}
                                    onChange={e => setManeuverSearch(e.target.value)}
                                    className="text-sm"
                                  />
                                  <div className="max-h-48 overflow-y-auto border rounded bg-background mt-2 p-2">
                                    {allManeuvers
                                      .filter(m => m.name.toLowerCase().includes(maneuverSearch.toLowerCase()))
                                      .map((maneuver) => {
                                        const isSelected = getCurrentManeuvers(lesson.id).some(m => m.id === maneuver.id)
                                        return (
                                          <label key={maneuver.id} className="flex items-center gap-2 py-1 px-1 text-sm cursor-pointer hover:bg-accent rounded transition">
                                            <Checkbox
                                              checked={isSelected}
                                              onCheckedChange={() => handleManeuverToggle(lesson.id, maneuver)}
                                              className="w-4 h-4"
                                            />
                                            <span className="truncate flex-1">{maneuver.name}</span>
                                          </label>
                                        )
                                      })}
                                  </div>
                                </div>

                                {/* Selected maneuvers */}
                                <div>
                                  <h4 className="font-medium mb-2">Selected Maneuvers</h4>
                                  {getCurrentManeuvers(lesson.id).length === 0 ? (
                                    <div className="text-center py-4 text-aviation-sunset-300">
                                      <Target className="w-8 h-8 mx-auto mb-2 text-aviation-sunset-300" />
                                      <p className="text-sm">No maneuvers selected</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {getCurrentManeuvers(lesson.id).map((maneuver) => (
                                        <div key={maneuver.lesson_maneuver_id || maneuver.id} className="border rounded p-2 bg-muted/50">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-sm">{maneuver.name}</span>
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              onClick={() => handleManeuverToggle(lesson.id, maneuver)}
                                              className="w-6 h-6 p-0"
                                            >
                                              ✕
                                            </Button>
                                          </div>
                                          <div className="flex items-center gap-2 mb-2">
                                            <Badge 
                                              variant={maneuver.is_required ? "default" : "secondary"}
                                              className="cursor-pointer text-xs"
                                              onClick={() => handleManeuverChange(lesson.id, maneuver.id, "is_required", !maneuver.is_required)}
                                            >
                                              {maneuver.is_required ? "Required" : "Optional"}
                                            </Badge>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Save button */}
                                {editingManeuvers[lesson.id] && (
                                  <Button onClick={() => saveManeuvers(lesson.id)} size="sm">
                                    Save Maneuvers
                                  </Button>
                                )}
                              </div>
                            </TabsContent>

                            <TabsContent value="settings" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Quick Actions</Label>
                                    <div className="flex gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => onLessonDuplicate(lesson.id)}
                                      >
                                        <Copy className="w-4 h-4 mr-2" />
                                        Duplicate
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => onLessonToggleActive(lesson.id, !lesson.is_active)}
                                      >
                                        {lesson.is_active === false ? (
                                          <>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Activate
                                          </>
                                        ) : (
                                          <>
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Deactivate
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Status</Label>
                                    <div className="flex items-center gap-2">
                                      {lesson.is_active !== false ? (
                                        <Badge className="bg-green-100 text-green-800">
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          Active
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary">
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Inactive
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                          </Tabs>
                        </CardContent>
                      )}
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Quick Edit Dialog */}
      <Dialog open={!!editingLesson} onOpenChange={() => setEditingLesson(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quick Edit Lesson</DialogTitle>
            <DialogDescription>
              Make quick changes to lesson details
            </DialogDescription>
          </DialogHeader>
          {editingLesson && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editingLesson.title}
                  onChange={(e) => setEditingLesson({...editingLesson, title: e.target.value})}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingLesson.description}
                  onChange={(e) => setEditingLesson({...editingLesson, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Estimated Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={editingLesson.estimated_hours}
                    onChange={(e) => setEditingLesson({...editingLesson, estimated_hours: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Lesson Type</Label>
                  <Select
                    value={editingLesson.lesson_type}
                    onValueChange={(value) => setEditingLesson({...editingLesson, lesson_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flight">Flight</SelectItem>
                      <SelectItem value="Ground">Ground</SelectItem>
                      <SelectItem value="Simulator">Simulator</SelectItem>
                      <SelectItem value="Checkride">Checkride</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLesson(null)}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (editingLesson) {
                  await onLessonUpdate(editingLesson.id, editingLesson)
                  setEditingLesson(null)
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading State */}
      {isReordering && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              <span>Updating lesson order...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 