"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plane, Plus, X, Search, GripVertical, Target, BookOpen, Star, TrendingUp, Check, AlertCircle } from "lucide-react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { useToast } from "@/hooks/use-toast"
import { FOI_PROFICIENCY_LEVELS } from "@/lib/foi-levels"

// =====================================================================
// TYPES
// =====================================================================

interface Maneuver {
  id: string
  name: string
  description?: string
  category?: string
  faa_reference?: string
  primary_acs_task_code?: string
}

interface LessonManeuver extends Maneuver {
  is_required: boolean
  is_introduction: boolean
  target_proficiency: 1 | 2 | 3 | 4
  emphasis_level: "introduction" | "standard" | "proficiency" | "mastery"
  instructor_notes?: string
  student_prep_notes?: string
  display_order: number
}

interface ManeuverSelectorEnhancedProps {
  lessonId: string
  lessonTitle: string
  selectedManeuvers: LessonManeuver[]
  onManeuversChange: (maneuvers: LessonManeuver[]) => void
}

// =====================================================================
// FOI PROFICIENCY BADGE COMPONENT
// =====================================================================

function FOIProficiencyBadge({ level }: { level: 1 | 2 | 3 | 4 }) {
  const info = FOI_PROFICIENCY_LEVELS[level]
  const colorClasses = {
    red: "bg-red-100 text-red-800 border-red-300",
    orange: "bg-orange-100 text-orange-800 border-orange-300",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    green: "bg-green-100 text-green-800 border-green-300"
  }

  return (
    <Badge variant="outline" className={`${colorClasses[info.color]} font-semibold`}>
      <span className="mr-1">{info.icon}</span>
      Level {level}: {info.name}
    </Badge>
  )
}

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export function ManeuverSelectorEnhanced({
  lessonId,
  lessonTitle,
  selectedManeuvers,
  onManeuversChange
}: ManeuverSelectorEnhancedProps) {
  const [allManeuvers, setAllManeuvers] = useState<Maneuver[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingManeuver, setEditingManeuver] = useState<LessonManeuver | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Fetch all available maneuvers
  useEffect(() => {
    setIsLoading(true)
    fetch('/api/admin/syllabus-maneuvers')
      .then(r => r.json())
      .then(data => {
        setAllManeuvers(data.maneuvers || [])
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to load maneuvers:', err)
        toast({
          title: "Error",
          description: "Failed to load maneuvers",
          variant: "destructive"
        })
        setIsLoading(false)
      })
  }, [toast])

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(allManeuvers.map(m => m.category || "Other")))]

  // Filter maneuvers
  const filteredManeuvers = allManeuvers.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.faa_reference?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === "all" || m.category === categoryFilter

    const notAlreadySelected = !selectedManeuvers.some(sm => (sm.maneuver_id || sm.id) === m.id)

    return matchesSearch && matchesCategory && notAlreadySelected
  })

  // =====================================================================
  // HANDLERS
  // =====================================================================

  const handleAddManeuver = (maneuver: Maneuver) => {
    // Check if maneuver is already added
    const alreadyAdded = selectedManeuvers.some(m => (m.maneuver_id || m.id) === maneuver.id)
    if (alreadyAdded) {
      toast({
        title: "Already Added",
        description: `${maneuver.name} is already in this lesson`,
        variant: "destructive"
      })
      return
    }

    const newManeuver: LessonManeuver = {
      ...maneuver,
      maneuver_id: maneuver.id,
      is_required: true,
      is_introduction: false,
      target_proficiency: 3, // Default to "Application" level
      emphasis_level: "standard",
      instructor_notes: "",
      student_prep_notes: "",
      display_order: selectedManeuvers.length
    }
    onManeuversChange([...selectedManeuvers, newManeuver])
    toast({
      title: "Maneuver added",
      description: `${maneuver.name} has been added to the lesson`
    })
    setIsDialogOpen(false)
    setSearchQuery("")
  }

  const handleRemoveManeuver = (maneuverId: string) => {
    const maneuver = selectedManeuvers.find(m => (m.maneuver_id || m.id) === maneuverId)
    onManeuversChange(selectedManeuvers.filter(m => (m.maneuver_id || m.id) !== maneuverId).map((m, index) => ({
      ...m,
      display_order: index
    })))
    toast({
      title: "Maneuver removed",
      description: `${maneuver?.name} has been removed from the lesson`
    })
  }

  const handleUpdateManeuver = (maneuverId: string, updates: Partial<LessonManeuver>) => {
    onManeuversChange(
      selectedManeuvers.map(m => 
        (m.maneuver_id || m.id) === maneuverId ? { ...m, ...updates } : m
      )
    )
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(selectedManeuvers)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update display_order
    const reorderedItems = items.map((item, index) => ({
      ...item,
      display_order: index
    }))

    onManeuversChange(reorderedItems)
  }

  const openEditDialog = (maneuver: LessonManeuver) => {
    setEditingManeuver(maneuver)
  }

  const closeEditDialog = () => {
    setEditingManeuver(null)
  }

  const saveEditedManeuver = () => {
    if (editingManeuver) {
      handleUpdateManeuver(editingManeuver.id, editingManeuver)
      toast({
        title: "Maneuver updated",
        description: `${editingManeuver.name} has been updated`
      })
      closeEditDialog()
    }
  }

  // =====================================================================
  // RENDER
  // =====================================================================

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-600" />
            Maneuvers & FOI Proficiency Targets
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {selectedManeuvers.length} maneuver{selectedManeuvers.length !== 1 ? 's' : ''} selected
            {selectedManeuvers.length > 0 && (
              <> • {selectedManeuvers.filter(m => m.is_required).length} required</>
            )}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Maneuver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh]" aria-describedby="add-maneuver-description">
            <DialogHeader>
              <DialogTitle>Add Maneuver to {lessonTitle}</DialogTitle>
              <DialogDescription id="add-maneuver-description">
                Search and select maneuvers to add to this lesson
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="search">Search Maneuvers</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by name, description, or FAA reference..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Filter by Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat === "all" ? "All Categories" : cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Maneuver List */}
              <ScrollArea className="h-[400px] border rounded-lg">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    Loading maneuvers...
                  </div>
                ) : filteredManeuvers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {searchQuery || categoryFilter !== "all" 
                      ? "No maneuvers match your search criteria" 
                      : "All available maneuvers have been added"}
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {filteredManeuvers.map(maneuver => (
                      <Card
                        key={maneuver.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        onClick={() => handleAddManeuver(maneuver)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {maneuver.name}
                                </h4>
                                {maneuver.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {maneuver.category}
                                  </Badge>
                                )}
                              </div>
                              {maneuver.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {maneuver.description}
                                </p>
                              )}
                              {maneuver.faa_reference && (
                                <p className="text-xs text-gray-500">
                                  FAA: {maneuver.faa_reference}
                                </p>
                              )}
                            </div>
                            <Button size="sm" variant="ghost">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* FOI Level Reference Guide */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            FAA Fundamentals of Instruction (FOI) - Levels of Learning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.values(FOI_PROFICIENCY_LEVELS).map(level => (
              <div key={level.level} className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{level.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">Level {level.level}: {level.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{level.shortDesc}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300">{level.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Maneuvers List */}
      {selectedManeuvers.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-12 text-center">
            <Plane className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Maneuvers Added Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add maneuvers to define what skills students will practice in this lesson
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Maneuver
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="maneuvers-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {selectedManeuvers.map((maneuver, index) => {
                  // Create a unique key combining lesson ID and maneuver ID to avoid duplicates
                  const uniqueKey = `${lessonId}-${maneuver.maneuver_id || maneuver.id}-${index}`
                  return (
                  <Draggable key={uniqueKey} draggableId={uniqueKey} index={index}>
                    {(provided, snapshot) => {
                      const maneuverId = maneuver.maneuver_id || maneuver.id
                      return (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="flex items-center cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="w-5 h-5 text-gray-400" />
                            </div>

                            {/* Maneuver Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                      {index + 1}. {maneuver.name}
                                    </h4>
                                    {maneuver.is_required && (
                                      <Badge variant="destructive" className="text-xs">
                                        Required
                                      </Badge>
                                    )}
                                    {maneuver.is_introduction && (
                                      <Badge variant="default" className="text-xs bg-purple-600">
                                        First Exposure
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {maneuver.description || "No description available"}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveManeuver(maneuverId)}
                                  className="flex-shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Quick Controls */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Target Proficiency */}
                                <div>
                                  <Label className="text-xs mb-1 block">Target Proficiency (FOI)</Label>
                                  <Select
                                    value={String(maneuver.target_proficiency)}
                                    onValueChange={(value) => handleUpdateManeuver(maneuverId, { target_proficiency: parseInt(value) as 1 | 2 | 3 | 4 })}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.values(FOI_PROFICIENCY_LEVELS).map(level => (
                                        <SelectItem key={level.level} value={String(level.level)}>
                                          <div className="flex items-center gap-2">
                                            <span>{level.icon}</span>
                                            <span>{level.level}: {level.name}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Emphasis Level */}
                                <div>
                                  <Label className="text-xs mb-1 block">Emphasis Level</Label>
                                  <Select
                                    value={maneuver.emphasis_level}
                                    onValueChange={(value: any) => handleUpdateManeuver(maneuverId, { emphasis_level: value })}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="introduction">Introduction</SelectItem>
                                      <SelectItem value="standard">Standard</SelectItem>
                                      <SelectItem value="proficiency">Proficiency</SelectItem>
                                      <SelectItem value="mastery">Mastery</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Toggles */}
                                <div className="flex flex-col gap-2">
                                  <label className="flex items-center gap-2 text-sm">
                                    <Switch
                                      checked={maneuver.is_required}
                                      onCheckedChange={(checked) => handleUpdateManeuver(maneuverId, { is_required: checked })}
                                    />
                                    <span>Required</span>
                                  </label>
                                  <label className="flex items-center gap-2 text-sm">
                                    <Switch
                                      checked={maneuver.is_introduction}
                                      onCheckedChange={(checked) => handleUpdateManeuver(maneuverId, { is_introduction: checked })}
                                    />
                                    <span>First Exposure</span>
                                  </label>
                                </div>
                              </div>

                              {/* Edit Button for Notes */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(maneuver)}
                                className="mt-3"
                              >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Add Notes & Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}}
                  </Draggable>
                )})}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Edit Maneuver Dialog */}
      {editingManeuver && (
        <Dialog open={!!editingManeuver} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="edit-maneuver-description">
            <DialogHeader>
              <DialogTitle>Edit Maneuver: {editingManeuver.name}</DialogTitle>
              <DialogDescription id="edit-maneuver-description">
                Add instructor notes and student preparation guidance
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Current Settings Summary */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                <p className="text-sm font-semibold">Current Settings:</p>
                <div className="flex flex-wrap gap-2">
                  <FOIProficiencyBadge level={editingManeuver.target_proficiency} />
                  <Badge variant="outline">
                    Emphasis: {editingManeuver.emphasis_level}
                  </Badge>
                  {editingManeuver.is_required && (
                    <Badge variant="destructive">Required</Badge>
                  )}
                  {editingManeuver.is_introduction && (
                    <Badge className="bg-purple-600">First Exposure</Badge>
                  )}
                </div>
              </div>

              {/* Instructor Notes */}
              <div>
                <Label htmlFor="instructor-notes">Instructor Notes</Label>
                <Textarea
                  id="instructor-notes"
                  placeholder="Teaching tips, common errors to watch for, safety considerations..."
                  value={editingManeuver.instructor_notes || ''}
                  onChange={(e) => setEditingManeuver({ ...editingManeuver, instructor_notes: e.target.value })}
                  className="min-h-[120px] mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Notes visible only to instructors
                </p>
              </div>

              {/* Student Prep Notes */}
              <div>
                <Label htmlFor="student-notes">Student Preparation Notes</Label>
                <Textarea
                  id="student-notes"
                  placeholder="What students should review before attempting this maneuver..."
                  value={editingManeuver.student_prep_notes || ''}
                  onChange={(e) => setEditingManeuver({ ...editingManeuver, student_prep_notes: e.target.value })}
                  className="min-h-[120px] mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Visible to students in lesson preparation materials
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeEditDialog}>
                Cancel
              </Button>
              <Button onClick={saveEditedManeuver}>
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

