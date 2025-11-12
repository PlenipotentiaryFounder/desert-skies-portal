"use client"

import { useState, useEffect, useTransition } from "react"
import { EnhancedLesson } from "@/lib/enhanced-syllabus-service"
import { 
  searchACSTasks, 
  linkACSStandardToLesson, 
  unlinkACSStandardFromLesson 
} from "@/lib/enhanced-syllabus-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  CheckCircle2, 
  Search, 
  Plus, 
  X, 
  Loader2,
  Star,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ACSStandardsTabProps {
  lesson: EnhancedLesson
  syllabusId: string
}

export function ACSStandardsTab({ lesson, syllabusId }: ACSStandardsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const results = await searchACSTasks(searchQuery)
      setSearchResults(results)
    } catch (error) {
      toast.error("Failed to search ACS tasks")
    } finally {
      setIsSearching(false)
    }
  }

  const handleLinkACS = (taskId: string, isPrimary = false) => {
    startTransition(async () => {
      const result = await linkACSStandardToLesson(lesson.id, taskId, isPrimary, 3)
      if (result.success) {
        toast.success("ACS standard linked")
        router.refresh()
        setSearchResults([])
        setSearchQuery("")
      } else {
        toast.error(result.error || "Failed to link ACS standard")
      }
    })
  }

  const handleUnlinkACS = (taskId: string) => {
    startTransition(async () => {
      const result = await unlinkACSStandardFromLesson(lesson.id, taskId)
      if (result.success) {
        toast.success("ACS standard unlinked")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to unlink ACS standard")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Current ACS Standards Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Linked ACS Standards
          </CardTitle>
          <CardDescription>
            ACS tasks covered in this lesson ({lesson.acs_standards?.length || 0} linked)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lesson.acs_standards && lesson.acs_standards.length > 0 ? (
            <div className="space-y-4">
              {lesson.acs_standards.map((standard) => (
                <div 
                  key={standard.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono">
                          {standard.task_code || 'Unknown'}
                        </Badge>
                        {standard.is_primary_focus && (
                          <Badge className="bg-yellow-500 hover:bg-yellow-600">
                            <Star className="h-3 w-3 mr-1" />
                            Primary Focus
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          Target: Level {standard.proficiency_target}
                        </Badge>
                      </div>
                      <h4 className="font-medium mb-1">
                        {standard.task_title || 'Untitled Task'}
                      </h4>
                      {standard.area_title && (
                        <p className="text-sm text-muted-foreground">
                          Area: {standard.area_code} - {standard.area_title}
                        </p>
                      )}
                      {standard.task_objective && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {standard.task_objective}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlinkACS(standard.acs_task_id)}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {standard.knowledge_elements && standard.knowledge_elements.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Knowledge Elements:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-0.5 ml-4">
                        {standard.knowledge_elements.slice(0, 3).map((element, idx) => (
                          <li key={idx}>• {element}</li>
                        ))}
                        {standard.knowledge_elements.length > 3 && (
                          <li className="italic">+ {standard.knowledge_elements.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No ACS Standards Linked</p>
              <p className="text-sm mt-1">
                Search and link ACS tasks that this lesson covers
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search & Add Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Search ACS Tasks
          </CardTitle>
          <CardDescription>
            Find and link ACS standards to this lesson
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by code (e.g., PA.I.A) or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((task) => (
                <div
                  key={task.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono">
                          {task.full_code}
                        </Badge>
                        {task.acs_areas && (
                          <span className="text-xs text-muted-foreground">
                            {task.acs_areas.title}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-sm">{task.title}</p>
                      {task.objective && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.objective}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleLinkACS(task.id)}
                      disabled={isPending}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No results found for "{searchQuery}"</p>
              <p className="text-xs mt-1">
                Try searching by ACS code (e.g., PA.I.A) or task title
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-base">ACS Integration Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p>
            <strong>Linking ACS Standards:</strong> Connect specific ACS tasks that students 
            will practice during this lesson. This helps track progress toward checkride readiness.
          </p>
          <p>
            <strong>Primary Focus:</strong> Mark 1-2 tasks as primary focus - these are the 
            main skills being developed in this lesson.
          </p>
          <p>
            <strong>Proficiency Targets:</strong> Set the expected proficiency level (1-4) 
            that students should reach by the end of this lesson.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

