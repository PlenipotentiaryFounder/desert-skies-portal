// Instructor Syllabi Page
// 1. List all syllabi
// 2. For each, list lessons and required maneuvers
// 3. Show lesson details and ACS standards (if available) 

import { getSyllabi, getSyllabusLessons } from "@/lib/syllabus-service"
import { getManeuversForLesson } from "@/lib/maneuver-service"
import { getACSStandardsForLesson } from "@/lib/acs-service"
import { Suspense } from "react"

export const metadata = {
  title: "Syllabi | Desert Skies",
  description: "View syllabi, lessons, and maneuvers for Desert Skies Flight School",
}

export default async function InstructorSyllabiPage() {
  const syllabi = await getSyllabi()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Syllabi</h1>
      <p className="text-muted-foreground mb-4">View all syllabi, lessons, and required maneuvers</p>
      <div className="space-y-8">
        {syllabi.length === 0 && <div>No syllabi found.</div>}
        {syllabi.map((syllabus) => (
          <SyllabusCard key={syllabus.id} syllabus={syllabus} />
        ))}
      </div>
    </div>
  )
}

async function SyllabusCard({ syllabus }: { syllabus: any }) {
  const lessons = await getSyllabusLessons(syllabus.id)
  return (
    <div className="border rounded-lg p-6 bg-background">
      <h2 className="text-2xl font-semibold mb-2">{syllabus.title}</h2>
      <div className="text-muted-foreground mb-2">{syllabus.faa_type} &bull; {syllabus.version}</div>
      <div className="mb-4">{syllabus.description}</div>
      <div className="space-y-4">
        {lessons.length === 0 && <div className="text-muted-foreground">No lessons found.</div>}
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  )
}

async function LessonCard({ lesson }: { lesson: any }) {
  const maneuvers = await getManeuversForLesson(lesson.id)
  const acsStandards = await getACSStandardsForLesson(lesson.id)
  
  return (
    <div className="border rounded p-4 bg-muted/50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
        <div>
          <div className="font-medium text-lg">{lesson.title}</div>
          <div className="text-sm text-muted-foreground">{lesson.lesson_type} &bull; Est. {lesson.estimated_hours} hrs</div>
        </div>
        {/* ACS Standards */}
        <div className="text-xs">
          {acsStandards.length > 0 ? (
            <div className="space-y-1">
              <div className="font-semibold text-blue-700">ACS Standards:</div>
              {acsStandards.slice(0, 2).map((standard) => (
                <div key={standard.id} className="text-blue-600 font-mono">
                  {standard.code}: {standard.title}
                </div>
              ))}
              {acsStandards.length > 2 && (
                <div className="text-muted-foreground italic">
                  +{acsStandards.length - 2} more standards
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground italic">No ACS standards linked</div>
          )}
        </div>
      </div>
      <div className="mb-2 text-sm">{lesson.description}</div>
      <div className="text-sm font-medium mb-1">Required Maneuvers:</div>
      <ul className="list-disc ml-6 space-y-1">
        {maneuvers.length === 0 && <li className="text-muted-foreground">None</li>}
        {maneuvers.map((m: any) => (
          <li key={m.id}>
            <span className="font-semibold">{m.name}</span>
            {m.faa_reference && <span className="ml-2 text-xs text-muted-foreground">({m.faa_reference})</span>}
            {m.is_required === false && <span className="ml-2 text-xs text-orange-600">(Optional)</span>}
          </li>
        ))}
      </ul>
    </div>
  )
} 