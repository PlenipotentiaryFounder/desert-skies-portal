"use client"

import type { Syllabus } from "@/lib/syllabus-service"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Eye, Pencil, Trash2, MoreVertical, BookOpen, Calendar } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { DeleteSyllabusDialog } from "./delete-syllabus-dialog"
import { formatDate } from "@/lib/utils"

interface SyllabusListProps {
  syllabi: Syllabus[]
}

export function SyllabusList({ syllabi }: SyllabusListProps) {
  const [syllabusToDelete, setSyllabusToDelete] = useState<Syllabus | null>(null)

  if (syllabi.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold">No syllabi found</h3>
        <p className="mt-2 text-gray-500">Get started by creating a new training syllabus.</p>
        <Link href="/admin/syllabi/new" className="mt-4 inline-block">
          <Button>Create Syllabus</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {syllabi.map((syllabus) => (
          <Card key={syllabus.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="line-clamp-1">{syllabus.title}</CardTitle>
                  <CardDescription>Version: {syllabus.version}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link href={`/admin/syllabi/${syllabus.id}`}>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                    </Link>
                    <Link href={`/admin/syllabi/${syllabus.id}/edit`}>
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Syllabus
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setSyllabusToDelete(syllabus)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Syllabus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-gray-500 line-clamp-3 mb-4">{syllabus.description}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant={syllabus.is_active ? "default" : "outline"}>
                  {syllabus.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="secondary">{syllabus.faa_type}</Badge>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 text-sm text-gray-500 flex justify-between">
              <div className="flex items-center">
                <BookOpen className="mr-1 h-4 w-4" />
                {syllabus.lesson_count || 0} Lessons
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                {formatDate(syllabus.created_at)}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <DeleteSyllabusDialog
        syllabus={syllabusToDelete}
        open={syllabusToDelete !== null}
        onOpenChange={() => setSyllabusToDelete(null)}
      />
    </>
  )
}
