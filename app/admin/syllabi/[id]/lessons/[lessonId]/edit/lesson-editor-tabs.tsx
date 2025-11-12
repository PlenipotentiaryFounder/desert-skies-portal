"use client"

import { useState, useTransition } from "react"
import { EnhancedLesson, EnhancedSyllabus } from "@/lib/enhanced-syllabus-service"
import { updateEnhancedLesson } from "@/lib/enhanced-syllabus-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { 
  FileText, 
  Target, 
  CheckCircle2, 
  Plane,
  Scale,
  Video,
  FileEdit,
  Mail,
  Save,
  Loader2
} from "lucide-react"

// Import tab components
import { BasicInfoTab } from "./tabs/basic-info-tab"
import { ObjectivesTab } from "./tabs/objectives-tab"
import { ACSStandardsTab } from "./tabs/acs-standards-tab"
import { ManeuversTab } from "./tabs/maneuvers-tab"
import { FARReferencesTab } from "./tabs/far-references-tab"
import { ResourcesTab } from "./tabs/resources-tab"
import { BriefingTab } from "./tabs/briefing-tab"
import { EmailTemplatesTab } from "./tabs/email-templates-tab"

interface LessonEditorTabsProps {
  lesson: EnhancedLesson
  syllabusId: string
  syllabus: EnhancedSyllabus
}

export function LessonEditorTabs({ lesson, syllabusId, syllabus }: LessonEditorTabsProps) {
  const [lessonData, setLessonData] = useState(lesson)
  const [activeTab, setActiveTab] = useState("basic")
  const [isPending, startTransition] = useTransition()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const router = useRouter()

  const updateLessonData = (updates: Partial<EnhancedLesson>) => {
    setLessonData(prev => ({ ...prev, ...updates }))
    setHasUnsavedChanges(true)
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateEnhancedLesson(lesson.id, lessonData)
      
      if (result.success) {
        toast.success("Lesson updated successfully")
        setHasUnsavedChanges(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update lesson")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Save Button - Always Visible */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-sm text-orange-600 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
              Unsaved changes
            </span>
          )}
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isPending || !hasUnsavedChanges}
          className="gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Tabbed Editor */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto">
          <TabsTrigger value="basic" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-3">
            <FileText className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Basic</span>
          </TabsTrigger>
          <TabsTrigger value="objectives" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-3">
            <Target className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Objectives</span>
          </TabsTrigger>
          <TabsTrigger value="acs" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-3">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs sm:text-sm">ACS</span>
          </TabsTrigger>
          <TabsTrigger value="maneuvers" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-3">
            <Plane className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Maneuvers</span>
          </TabsTrigger>
          <TabsTrigger value="far" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-3">
            <Scale className="h-4 w-4" />
            <span className="text-xs sm:text-sm">FAR</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-3">
            <Video className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Resources</span>
          </TabsTrigger>
          <TabsTrigger value="briefing" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-3">
            <FileEdit className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Briefing</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-3">
            <Mail className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Email</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-6">
          <BasicInfoTab 
            lesson={lessonData} 
            updateLesson={updateLessonData}
            syllabus={syllabus}
          />
        </TabsContent>

        <TabsContent value="objectives" className="space-y-4 mt-6">
          <ObjectivesTab 
            lesson={lessonData} 
            updateLesson={updateLessonData}
          />
        </TabsContent>

        <TabsContent value="acs" className="space-y-4 mt-6">
          <ACSStandardsTab 
            lesson={lessonData}
            syllabusId={syllabusId}
          />
        </TabsContent>

        <TabsContent value="maneuvers" className="space-y-4 mt-6">
          <ManeuversTab 
            lesson={lessonData}
            syllabusId={syllabusId}
          />
        </TabsContent>

        <TabsContent value="far" className="space-y-4 mt-6">
          <FARReferencesTab 
            lesson={lessonData}
          />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4 mt-6">
          <ResourcesTab 
            lesson={lessonData}
          />
        </TabsContent>

        <TabsContent value="briefing" className="space-y-4 mt-6">
          <BriefingTab 
            lesson={lessonData} 
            updateLesson={updateLessonData}
          />
        </TabsContent>

        <TabsContent value="email" className="space-y-4 mt-6">
          <EmailTemplatesTab 
            lesson={lessonData} 
            updateLesson={updateLessonData}
          />
        </TabsContent>
      </Tabs>

      {/* Bottom Save Button */}
      <div className="flex justify-end border-t pt-4">
        <Button 
          onClick={handleSave} 
          disabled={isPending || !hasUnsavedChanges}
          className="gap-2"
          size="lg"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

