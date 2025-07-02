'use client'
import { Sidebar } from "./Sidebar"
import { useState, useEffect } from "react"
import LessonInfoPanel from "./LessonInfoPanel"
import ManeuversPanel from "./ManeuversPanel"
import CoreTopicsPanel from "./CoreTopicsPanel"
import ResourcesPanel from "./ResourcesPanel"
import WhatToBringPanel from "./WhatToBringPanel"
import PreviewEmailPanel from "./PreviewEmailPanel"
import JsonImportExportPanel from "./JsonImportExportPanel"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

const PANELS = [
  "Lesson Info",
  "Maneuvers",
  "Core Topics",
  "Resources",
  "What to Bring",
  "Preview/Email",
  "JSON Import/Export",
]

// Define a type for maneuvers with rubric fields
interface ManeuverWithRubric {
  id: string
  name: string
  is_required: boolean
  default_score: number
  instructor_notes: string
  is_scorable?: boolean
  scoring_labels?: string
  example_feedback?: string
  // ...any other fields
}

export default function LessonBuilderWorkstation() {
  const [panel, setPanel] = useState(PANELS[0])
  const [lessonInfo, setLessonInfo] = useState({})
  const [maneuvers, setManeuvers] = useState<ManeuverWithRubric[]>([])
  const [coreTopics, setCoreTopics] = useState([])
  const [resources, setResources] = useState([])
  const [whatToBring, setWhatToBring] = useState([])
  const [lessonId, setLessonId] = useState("")
  const [feedbackFields, setFeedbackFields] = useState("")
  const [feedbackInstructions, setFeedbackInstructions] = useState("")
  const { toast } = useToast()
  const [allLessons, setAllLessons] = useState<any[]>([])

  useEffect(() => {
    async function fetchLessons() {
      const res = await fetch("/api/instructor/schedule/lessons")
      const data = await res.json()
      setAllLessons(data.lessons || [])
    }
    fetchLessons()
  }, [])

  function handleImportAll(data: any) {
    setLessonInfo(data.lessonInfo || {})
    setManeuvers(data.maneuvers || [])
    setFeedbackFields(data.feedback_fields || "")
    setFeedbackInstructions(data.feedback_instructions || "")
    setCoreTopics(data.coreTopics || [])
    setResources(data.resources || [])
    setWhatToBring(data.whatToBring || [])
  }

  async function saveLesson() {
    try {
      const method = lessonId ? "PUT" : "POST"
      const res = await fetch("/api/admin/syllabus-lessons", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lessonId,
          ...lessonInfo,
          maneuvers,
          feedback_fields: feedbackFields,
          feedback_instructions: feedbackInstructions,
          coreTopics,
          resources,
          whatToBring
        })
      })
      const data = await res.json()
      if (res.ok) {
        if (!lessonId && data.lesson?.id) setLessonId(data.lesson.id)
        toast({ title: "Lesson saved!", description: `Lesson ${data.lesson?.title || ""} saved successfully.`, variant: "default" })
      } else {
        toast({ title: "Save failed", description: data.error || "Unknown error", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Save failed", description: (e as any).message || "Unknown error", variant: "destructive" })
    }
  }

  async function loadLesson() {
    if (!lessonId) return toast({ title: "No lesson ID", description: "Enter a lesson ID to load.", variant: "destructive" })
    try {
      const res = await fetch(`/api/admin/syllabus-lessons?id=${lessonId}`)
      const data = await res.json()
      if (res.ok) {
        setLessonInfo(data.lesson || {})
        setManeuvers(data.maneuvers || [])
        setFeedbackFields(data.feedback_fields || "")
        setFeedbackInstructions(data.feedback_instructions || "")
        setCoreTopics(data.coreTopics || [])
        setResources(data.resources || [])
        setWhatToBring(data.whatToBring || [])
        toast({ title: "Lesson loaded!", description: `Lesson ${data.lesson?.title || ""} loaded successfully.`, variant: "default" })
      } else {
        toast({ title: "Load failed", description: data.error || "Unknown error", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Load failed", description: (e as any).message || "Unknown error", variant: "destructive" })
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar panels={PANELS} selected={panel} onSelect={setPanel} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center gap-4 mb-4">
          <Button onClick={saveLesson} className="btn btn-primary">Save Lesson</Button>
          <Input value={lessonId} onChange={e => setLessonId(e.target.value)} placeholder="Lesson ID (for load/edit)" className="w-48" />
          <Select value={lessonId} onValueChange={val => { setLessonId(val); if (val) loadLesson(); }}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select existing lesson..." />
            </SelectTrigger>
            <SelectContent>
              {allLessons.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.title || l.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={loadLesson} variant="secondary">Load Lesson</Button>
        </div>
        <h1 className="text-2xl font-bold mb-4">Ultimate Lesson Builder</h1>
        <div className="bg-white rounded shadow p-6 min-h-[400px]">
          <h2 className="text-xl font-semibold mb-2">{panel}</h2>
          {panel === "Lesson Info" ? (
            <>
              <LessonInfoPanel value={lessonInfo} onChange={setLessonInfo} />
              <div className="mt-6 flex justify-end">
                <button className="btn btn-primary">Save Lesson Info</button>
              </div>
            </>
          ) : panel === "Maneuvers" ? (
            <>
              <ManeuversPanel
                value={maneuvers}
                onChange={setManeuvers}
                feedbackFields={feedbackFields}
                onFeedbackFieldsChange={setFeedbackFields}
                feedbackInstructions={feedbackInstructions}
                onFeedbackInstructionsChange={setFeedbackInstructions}
              />
              <div className="mt-6 flex justify-end">
                <button className="btn btn-primary">Save Maneuvers</button>
              </div>
            </>
          ) : panel === "Core Topics" ? (
            <>
              <CoreTopicsPanel value={coreTopics} onChange={setCoreTopics} />
              <div className="mt-6 flex justify-end">
                <button className="btn btn-primary">Save Core Topics</button>
              </div>
            </>
          ) : panel === "Resources" ? (
            <>
              <ResourcesPanel value={resources} onChange={setResources} />
              <div className="mt-6 flex justify-end">
                <button className="btn btn-primary">Save Resources</button>
              </div>
            </>
          ) : panel === "What to Bring" ? (
            <>
              <WhatToBringPanel value={whatToBring} onChange={setWhatToBring} />
              <div className="mt-6 flex justify-end">
                <button className="btn btn-primary">Save What to Bring</button>
              </div>
            </>
          ) : panel === "Preview/Email" ? (
            <PreviewEmailPanel
              lessonInfo={lessonInfo}
              maneuvers={maneuvers}
              coreTopics={coreTopics}
              resources={resources}
              whatToBring={whatToBring}
            />
          ) : panel === "JSON Import/Export" ? (
            <JsonImportExportPanel
              lessonInfo={lessonInfo}
              maneuvers={maneuvers}
              coreTopics={coreTopics}
              resources={resources}
              whatToBring={whatToBring}
              feedback_fields={feedbackFields}
              feedback_instructions={feedbackInstructions}
              onImport={handleImportAll}
            />
          ) : (
            <div className="text-gray-500">Panel content for {panel} goes here.</div>
          )}
        </div>
      </main>
    </div>
  )
} 