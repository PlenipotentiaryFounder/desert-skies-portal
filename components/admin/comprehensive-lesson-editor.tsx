"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Info,
  Target,
  CheckCircle2,
  Plane,
  BookOpen,
  FileText,
  Link2,
  Settings,
  Plus,
  X,
  Save,
  AlertCircle,
  Star
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { SyllabusLesson } from "@/lib/syllabus-service"
import { ManeuverSelectorEnhanced } from "@/components/admin/maneuver-selector-enhanced"

interface PerformanceStandard {
  id: string
  standard_text: string
  acs_reference?: string
  is_required: boolean
}

interface LessonManeuver {
  id: string
  maneuver_id?: string
  name: string
  description?: string
  category?: string
  faa_reference?: string
  target_proficiency: 1 | 2 | 3 | 4
  emphasis_level: 'introduction' | 'standard' | 'proficiency' | 'mastery'
  is_required: boolean
  is_introduction: boolean
  instructor_notes?: string
  student_prep_notes?: string
  display_order: number
}

interface LessonResource {
  id: string
  title: string
  description?: string
  resource_type: 'video' | 'document' | 'faa_reference' | 'external_link' | 'pdf'
  url: string
  is_required: boolean
  category?: 'pre_flight' | 'post_flight' | 'supplemental'
}

interface ComprehensiveLessonEditorProps {
  lesson: SyllabusLesson & {
    maneuvers?: any[]
    is_active?: boolean
  }
  syllabusId: string
  onSave: (lessonId: string, updates: Partial<SyllabusLesson>) => Promise<void>
  onClose: () => void
}

export function ComprehensiveLessonEditor({
  lesson,
  syllabusId,
  onSave,
  onClose
}: ComprehensiveLessonEditorProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Basic Info
  const [title, setTitle] = useState(lesson.title)
  const [description, setDescription] = useState(lesson.description || '')
  const [lessonType, setLessonType] = useState(lesson.lesson_type)
  const [estimatedHours, setEstimatedHours] = useState(lesson.estimated_hours)
  const [orderIndex, setOrderIndex] = useState(lesson.order_index)

  // Objectives
  const [objective, setObjective] = useState(lesson.objective || '')
  
  // Performance Standards
  const [performanceStandards, setPerformanceStandards] = useState<PerformanceStandard[]>([])
  
  // Maneuvers
  const [selectedManeuvers, setSelectedManeuvers] = useState<LessonManeuver[]>([])
  
  // Briefing & Notes
  const [notes, setNotes] = useState(lesson.notes || '')
  const [finalThoughts, setFinalThoughts] = useState(lesson.final_thoughts || '')
  
  // Resources
  const [resources, setResources] = useState<LessonResource[]>([])
  
  // Settings
  const [emailSubject, setEmailSubject] = useState(lesson.email_subject || '')
  const [emailBody, setEmailBody] = useState(lesson.email_body || '')

  // Load lesson maneuvers on mount
  useEffect(() => {
    if (lesson.maneuvers && lesson.maneuvers.length > 0) {
      // Transform lesson maneuvers to the format expected by the selector
      const formattedManeuvers: LessonManeuver[] = lesson.maneuvers.map((m: any, index) => ({
        id: m.id || m.maneuver_id,
        maneuver_id: m.maneuver_id || m.id,
        name: m.name,
        description: m.description,
        category: m.category,
        faa_reference: m.faa_reference,
        target_proficiency: m.target_proficiency || 3,
        emphasis_level: m.emphasis_level || 'standard',
        is_required: m.is_required !== false,
        is_introduction: m.is_introduction || false,
        instructor_notes: m.instructor_notes || '',
        student_prep_notes: m.student_prep_notes || '',
        display_order: m.display_order !== undefined ? m.display_order : index
      }))
      setSelectedManeuvers(formattedManeuvers)
    }
  }, [lesson.maneuvers])

  // Track changes
  useEffect(() => {
    setHasChanges(true)
  }, [title, description, lessonType, estimatedHours, objective, notes, finalThoughts, selectedManeuvers])

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Lesson title is required",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      // Save lesson basic data
      await onSave(lesson.id, {
        title,
        description,
        lesson_type: lessonType,
        estimated_hours: estimatedHours,
        order_index: orderIndex,
        objective,
        performance_standards: performanceStandards.map(s => s.standard_text).join('\n'),
        notes,
        final_thoughts: finalThoughts,
        email_subject: emailSubject,
        email_body: emailBody
      })

      // Save maneuvers separately (if changed)
      if (selectedManeuvers.length > 0 || lesson.maneuvers?.length) {
        const maneuverData = selectedManeuvers.map(m => ({
          maneuver_id: m.maneuver_id || m.id,
          is_required: m.is_required,
          is_introduction: m.is_introduction,
          target_proficiency: m.target_proficiency,
          emphasis_level: m.emphasis_level,
          instructor_notes: m.instructor_notes || null,
          student_prep_notes: m.student_prep_notes || null,
          display_order: m.display_order
        }))

        const response = await fetch('/api/admin/lesson-maneuvers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId: lesson.id,
            maneuvers: maneuverData
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save maneuvers')
        }
      }

      toast({
        title: "Success",
        description: "Lesson and maneuvers updated successfully"
      })
      setHasChanges(false)
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save lesson changes",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  const addPerformanceStandard = () => {
    setPerformanceStandards([
      ...performanceStandards,
      {
        id: crypto.randomUUID(),
        standard_text: '',
        is_required: true
      }
    ])
  }

  const removePerformanceStandard = (id: string) => {
    setPerformanceStandards(performanceStandards.filter(s => s.id !== id))
  }

  const updatePerformanceStandard = (id: string, updates: Partial<PerformanceStandard>) => {
    setPerformanceStandards(performanceStandards.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ))
  }

  const addResource = () => {
    setResources([
      ...resources,
      {
        id: crypto.randomUUID(),
        title: '',
        resource_type: 'external_link',
        url: '',
        is_required: false
      }
    ])
  }

  const removeResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id))
  }

  const updateResource = (id: string, updates: Partial<LessonResource>) => {
    setResources(resources.map(r => 
      r.id === id ? { ...r, ...updates } : r
    ))
  }

  const LESSON_TYPES = [
    { value: 'Flight', label: 'Flight', icon: Plane, color: 'blue' },
    { value: 'Ground', label: 'Ground', icon: BookOpen, color: 'green' },
    { value: 'Simulator', label: 'Simulator (AATD/BATD)', icon: Target, color: 'purple' },
    { value: 'Solo', label: 'Solo Flight', icon: Plane, color: 'orange' },
    { value: 'Checkride', label: 'Stage Check / Checkride', icon: CheckCircle2, color: 'red' }
  ]

  return (
    <div className="space-y-4">
      {/* Header with Save/Cancel */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                {lesson.order_index + 1}
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                  Editing: {lesson.title}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Make changes to any field and click Save when done
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Unsaved Changes
                </Badge>
              )}
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Comprehensive Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-8 mb-6">
              <TabsTrigger value="basic" className="text-xs">
                <Info className="w-3 h-3 mr-1" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="objectives" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                Objectives
              </TabsTrigger>
              <TabsTrigger value="standards" className="text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Standards
              </TabsTrigger>
              <TabsTrigger value="maneuvers" className="text-xs">
                <Plane className="w-3 h-3 mr-1" />
                Maneuvers
              </TabsTrigger>
              <TabsTrigger value="acs" className="text-xs">
                <BookOpen className="w-3 h-3 mr-1" />
                ACS/FAR
              </TabsTrigger>
              <TabsTrigger value="briefing" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                Briefing
              </TabsTrigger>
              <TabsTrigger value="resources" className="text-xs">
                <Link2 className="w-3 h-3 mr-1" />
                Resources
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Basic Info */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="title" className="text-gray-900 dark:text-gray-100">
                    Lesson Title *
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., F1 - Aircraft Familiarization"
                    className="text-lg font-semibold"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description" className="text-gray-900 dark:text-gray-100">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief overview of what this lesson covers..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lesson-type" className="text-gray-900 dark:text-gray-100">
                    Lesson Type *
                  </Label>
                  <Select value={lessonType} onValueChange={setLessonType}>
                    <SelectTrigger id="lesson-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LESSON_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours" className="text-gray-900 dark:text-gray-100">
                    Estimated Hours *
                  </Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order" className="text-gray-900 dark:text-gray-100">
                    Order / Position
                  </Label>
                  <Input
                    id="order"
                    type="number"
                    min="0"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(parseInt(e.target.value))}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Use drag-and-drop to reorder lessons
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Objectives */}
            <TabsContent value="objectives" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="objective" className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  Learning Objectives
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  What should students be able to do after completing this lesson?
                </p>
                <Textarea
                  id="objective"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="e.g., The student will be able to identify all major aircraft components, understand their functions, and perform a complete preflight inspection to ACS standards."
                  className="min-h-[200px]"
                />
              </div>
            </TabsContent>

            {/* Tab 3: Performance Standards */}
            <TabsContent value="standards" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Performance Standards
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Specific measurable criteria for successful lesson completion
                  </p>
                </div>
                <Button onClick={addPerformanceStandard} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Standard
                </Button>
              </div>

              {performanceStandards.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    No performance standards defined yet
                  </p>
                  <Button onClick={addPerformanceStandard} variant="outline" size="sm">
                    Add Your First Standard
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {performanceStandards.map((standard, index) => (
                    <Card key={standard.id}>
                      <CardContent className="pt-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-3">
                            <Textarea
                              value={standard.standard_text}
                              onChange={(e) => updatePerformanceStandard(standard.id, { standard_text: e.target.value })}
                              placeholder="e.g., Student correctly identifies all V-speeds and their significance"
                              className="min-h-[80px]"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-gray-700 dark:text-gray-300">ACS Reference (Optional)</Label>
                                <Input
                                  value={standard.acs_reference || ''}
                                  onChange={(e) => updatePerformanceStandard(standard.id, { acs_reference: e.target.value })}
                                  placeholder="e.g., PA.I.E.K1"
                                  className="text-sm"
                                />
                              </div>
                              <div className="flex items-end">
                                <label className="flex items-center gap-2 text-sm">
                                  <Switch
                                    checked={standard.is_required}
                                    onCheckedChange={(checked) => updatePerformanceStandard(standard.id, { is_required: checked })}
                                  />
                                  <span className="text-gray-900 dark:text-gray-100">Required</span>
                                </label>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePerformanceStandard(standard.id)}
                            className="flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab 4: Maneuvers */}
            <TabsContent value="maneuvers" className="space-y-4">
              <ManeuverSelectorEnhanced
                lessonId={lesson.id}
                lessonTitle={title}
                selectedManeuvers={selectedManeuvers}
                onManeuversChange={setSelectedManeuvers}
              />
            </TabsContent>

            {/* Tab 5: ACS & FAR References */}
            <TabsContent value="acs" className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  ACS Standards & FAR References
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Link this lesson to specific ACS tasks and FAA regulations
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 border-2 border-dashed rounded-lg text-center">
                  <BookOpen className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">ACS Standards</p>
                  <p className="text-xs text-gray-500">Link to ACS tasks (e.g., PA.I.E)</p>
                </div>
                <div className="p-6 border-2 border-dashed rounded-lg text-center">
                  <FileText className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">FAR References</p>
                  <p className="text-xs text-gray-500">Link to regulations (e.g., 91.103)</p>
                </div>
              </div>
            </TabsContent>

            {/* Tab 6: Notes & Guidance */}
            <TabsContent value="briefing" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Lesson Notes
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  General notes, teaching tips, and key points for this lesson
                </p>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value)
                    setHasChanges(true)
                  }}
                  placeholder="General lesson notes, teaching tips, important points to cover..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="final-thoughts" className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  Final Thoughts / Summary
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Concluding remarks, key takeaways, transition to next lesson
                </p>
                <Textarea
                  id="final-thoughts"
                  value={finalThoughts}
                  onChange={(e) => {
                    setFinalThoughts(e.target.value)
                    setHasChanges(true)
                  }}
                  placeholder="Final thoughts, summary, transition notes..."
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>
            </TabsContent>

            {/* Tab 7: Resources */}
            <TabsContent value="resources" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-blue-600" />
                    Learning Resources
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Videos, documents, links, and FAA references
                  </p>
                </div>
                <Button onClick={addResource} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Resource
                </Button>
              </div>

              {resources.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Link2 className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    No resources added yet
                  </p>
                  <Button onClick={addResource} variant="outline" size="sm">
                    Add Your First Resource
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {resources.map((resource, index) => (
                    <Card key={resource.id}>
                      <CardContent className="pt-4">
                        <div className="flex gap-3">
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                value={resource.title}
                                onChange={(e) => updateResource(resource.id, { title: e.target.value })}
                                placeholder="Resource title..."
                              />
                              <Select
                                value={resource.resource_type}
                                onValueChange={(value: any) => updateResource(resource.id, { resource_type: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="video">Video</SelectItem>
                                  <SelectItem value="external_link">Web Link</SelectItem>
                                  <SelectItem value="faa_reference">FAA Reference</SelectItem>
                                  <SelectItem value="pdf">PDF Document</SelectItem>
                                  <SelectItem value="document">Document</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Input
                              value={resource.url}
                              onChange={(e) => updateResource(resource.id, { url: e.target.value })}
                              placeholder="URL or file path..."
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Select
                                value={resource.category || 'supplemental'}
                                onValueChange={(value: any) => updateResource(resource.id, { category: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pre_flight">Pre-Flight</SelectItem>
                                  <SelectItem value="post_flight">Post-Flight</SelectItem>
                                  <SelectItem value="supplemental">Supplemental</SelectItem>
                                </SelectContent>
                              </Select>
                              <label className="flex items-center gap-2">
                                <Switch
                                  checked={resource.is_required}
                                  onCheckedChange={(checked) => updateResource(resource.id, { is_required: checked })}
                                />
                                <span className="text-sm text-gray-900 dark:text-gray-100">Required</span>
                              </label>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeResource(resource.id)}
                            className="flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab 8: Settings */}
            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Email Templates (Optional)</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Customize email notifications sent to students when this lesson is assigned
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="email-subject" className="text-gray-900 dark:text-gray-100">
                    Email Subject
                  </Label>
                  <Input
                    id="email-subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g., Preparation for Flight {{lesson_number}}: {{lesson_title}}"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-body" className="text-gray-900 dark:text-gray-100">
                    Email Body
                  </Label>
                  <Textarea
                    id="email-body"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Template for lesson preparation emails to students..."
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Available variables: {'{'}lesson_number{'}'}, {'{'}lesson_title{'}'}, {'{'}student_name{'}'}, {'{'}instructor_name{'}'}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

