'use client'
import { useEffect, useState, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, GripVertical, X, Check, AlertCircle } from "lucide-react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { cn } from "@/lib/utils"

export default function ManeuversPanel({ 
  value, 
  onChange, 
  feedbackFields, 
  onFeedbackFieldsChange, 
  feedbackInstructions, 
  onFeedbackInstructionsChange, 
  syllabusId,
  lessonId 
}: {
  value: any[],
  onChange: (v: any[]) => void,
  feedbackFields: string,
  onFeedbackFieldsChange: (v: string) => void,
  feedbackInstructions: string,
  onFeedbackInstructionsChange: (v: string) => void,
  syllabusId: string,
  lessonId?: string
}) {
  const [allManeuvers, setAllManeuvers] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<any[]>(value || [])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Ensure we only render client-side specific content after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Fetch all maneuvers
    fetch(`/api/admin/syllabus-maneuvers?syllabusId=${syllabusId}`)
      .then(r => r.json())
      .then(data => setAllManeuvers(data.maneuvers || []))
      .catch(error => {
        console.error('Error fetching maneuvers:', error)
        toast({
          title: "Error",
          description: "Failed to load maneuvers",
          variant: "destructive",
        })
      })
  }, [syllabusId, toast])

  useEffect(() => {
    // Load existing lesson-maneuver associations if lessonId is provided
    if (lessonId) {
      setLoading(true)
      fetch(`/api/admin/syllabus-maneuvers?lessonId=${lessonId}`)
        .then(r => r.json())
        .then(data => {
          const lessonManeuvers = data.maneuvers || []
          setSelected(lessonManeuvers)
          onChange(lessonManeuvers)
        })
        .catch(error => {
          console.error('Error fetching lesson maneuvers:', error)
          toast({
            title: "Error",
            description: "Failed to load lesson maneuvers",
            variant: "destructive",
          })
        })
        .finally(() => setLoading(false))
    }
  }, [lessonId, onChange, toast])

  useEffect(() => {
    setSelected(value || [])
  }, [value])

  // Auto-save function with debouncing
  const debouncedSave = useCallback(
    (maneuvers: any[]) => {
      if (!lessonId) return

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Set new timeout
      saveTimeoutRef.current = setTimeout(async () => {
        setSaveStatus('saving')
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

          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
          console.error('Error saving maneuvers:', error)
          setSaveStatus('error')
          toast({
            title: "Error",
            description: "Failed to auto-save maneuvers",
            variant: "destructive",
          })
          setTimeout(() => setSaveStatus('idle'), 3000)
        }
      }, 1000) // 1 second debounce
    },
    [lessonId, toast]
  )

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  function handleToggle(maneuver: any) {
    const exists = selected.find((m) => m.id === maneuver.id)
    let next
    if (exists) {
      next = selected.filter((m) => m.id !== maneuver.id)
    } else {
      next = [...selected, { 
        ...maneuver, 
        is_required: true, 
        default_score: 0, 
        instructor_notes: "", 
        is_scorable: false, 
        scoring_labels: "", 
        example_feedback: "" 
      }]
    }
    setSelected(next)
    onChange(next)
    debouncedSave(next)
  }

  function handleChange(id: string, field: string, val: any) {
    const next = selected.map((m) => m.id === id ? { ...m, [field]: val } : m)
    setSelected(next)
    onChange(next)
    debouncedSave(next)
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return

    const items = Array.from(selected)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSelected(items)
    onChange(items)
    debouncedSave(items)
  }

  const filtered = allManeuvers.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
  const selectedIds = new Set(selected.map(m => m.id))

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading maneuvers...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selected Maneuvers Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Selected Maneuvers ({selected.length})</h3>
          {isClient && lessonId && (
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <Check className="h-3 w-3" />
                  Saved
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  Error
                </div>
              )}
            </div>
          )}
        </div>
        
        {selected.length === 0 ? (
          <div className="text-xs text-aviation-sunset-300 p-4 text-center border rounded-lg bg-muted/30">
            No maneuvers selected. Use the search below to add maneuvers.
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="selected-maneuvers">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "space-y-2 min-h-[100px] p-2 border rounded-lg bg-muted/20",
                    snapshot.isDraggingOver && "bg-blue-50 border-blue-200"
                  )}
                >
                  {selected.map((m, index) => (
                    <Draggable key={m.id} draggableId={m.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "flex items-center gap-2 p-2 bg-white border rounded-md shadow-sm transition-all",
                            snapshot.isDragging && "shadow-lg ring-2 ring-blue-200 rotate-1"
                          )}
                        >
                          {/* Drag Handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab hover:cursor-grabbing text-aviation-sunset-300 hover:text-aviation-sunset-200"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          
                          {/* Maneuver Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{m.name}</span>
                              <Badge 
                                variant={m.is_required ? "default" : "secondary"} 
                                className="cursor-pointer text-xs px-1 py-0"
                                onClick={() => handleChange(m.id, "is_required", !m.is_required)}
                              >
                                {m.is_required ? "Required" : "Optional"}
                              </Badge>
                            </div>
                            {m.category && (
                              <div className="text-xs text-aviation-sunset-300 mt-1">{m.category}</div>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <Badge 
                              variant={m.is_scorable ? "default" : "outline"} 
                              className="cursor-pointer text-xs px-1 py-0"
                              onClick={() => handleChange(m.id, "is_scorable", !m.is_scorable)}
                            >
                              {m.is_scorable ? "Scorable" : "Info Only"}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleToggle(m)} 
                              className="w-6 h-6 p-0 text-aviation-sunset-300 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Add Maneuvers Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Add Maneuvers</h3>
          <div className="text-xs text-aviation-sunset-300">
            {filtered.length} of {allManeuvers.length} maneuvers
          </div>
        </div>
        
        <Input
          placeholder="Search maneuvers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-xs px-2 py-1 mb-2"
        />
        
        <div className="max-h-48 overflow-y-auto border rounded bg-background p-2">
          {filtered.length === 0 && (
            <div className="text-xs text-gray-400 text-center p-4">
              {search ? "No maneuvers found matching your search." : "No maneuvers available."}
            </div>
          )}
          {filtered.map((m) => (
            <label key={m.id} className="flex items-center gap-2 py-1 px-2 text-xs cursor-pointer hover:bg-accent rounded transition">
              <Checkbox
                checked={selectedIds.has(m.id)}
                onCheckedChange={() => handleToggle(m)}
                className="w-4 h-4"
                aria-label={`Select maneuver ${m.name}`}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{m.name}</div>
                {m.category && (
                  <div className="text-xs text-aviation-sunset-300">{m.category}</div>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Lesson-level feedback template */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2 text-sm">Lesson Feedback Template</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium mb-1">Feedback Fields</label>
            <Input
              value={feedbackFields}
              onChange={e => onFeedbackFieldsChange(e.target.value)}
              placeholder="e.g. Overall Performance, Strengths"
              className="text-xs px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Feedback Instructions</label>
            <Textarea
              placeholder="Instructions for providing lesson feedback (optional)"
              value={feedbackInstructions}
              onChange={e => onFeedbackInstructionsChange(e.target.value)}
              className="text-xs px-2 py-1"
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 