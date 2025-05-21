"use client"

import type { SyllabusLesson } from "@/lib/syllabus-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Eye, Pencil, Trash2, MoreVertical, BookOpen, Clock } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { DeleteLessonDialog } from "./delete-lesson-dialog"

interface LessonListProps {
  lessons: SyllabusLesson[]
  syllabusId: string
}

export function LessonList({ lessons, syllabusId }: LessonListProps) {
  const [lessonToDelete, setLessonToDelete] = useState<SyllabusLesson | null>(null)

  if (lessons.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold">No lessons found</h3>
        <p className="mt-2 text-gray-500">Get started by adding lessons to this syllabus.</p>
        <Link href={`/admin/syllabi/${syllabusId}/lessons/new`} className="mt-4 inline-block">
          <Button>Add Lesson</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {lessons.map((lesson) => (
          <Card key={lesson.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">
                    {lesson.order_index}
                  </div>
                  <CardTitle className="text-xl">{lesson.title}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link href={`/admin/syllabi/${syllabusId}/lessons/${lesson.id}`}>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                    </Link>
                    <Link href={`/admin/syllabi/${syllabusId}/lessons/${lesson.id}/edit`}>
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Lesson
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setLessonToDelete(lesson)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Lesson
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4 line-clamp-2">{lesson.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{lesson.lesson_type}</Badge>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="mr-1 h-4 w-4" />
                  {lesson.estimated_hours} hours
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DeleteLessonDialog
        lesson={lessonToDelete}
        syllabusId={syllabusId}
        open={lessonToDelete !== null}
        onOpenChange={() => setLessonToDelete(null)}
      />
    </>
  )
}
