"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { Search, UserPlus } from "lucide-react"
import { useState } from "react"

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
  status: string
  enrollment?: {
    id: string
    start_date: string
    syllabus?: {
      title: string
      faa_type: string
    }
  }
}

interface InstructorStudentsListProps {
  enrollments: any[]
}

export function InstructorStudentsList({ enrollments }: InstructorStudentsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  // Transform enrollments to students
  const students: Student[] = enrollments.map((enrollment) => ({
    id: enrollment.student.id,
    first_name: enrollment.student.first_name,
    last_name: enrollment.student.last_name,
    email: enrollment.student.email,
    avatar_url: enrollment.student.avatar_url,
    status: enrollment.student.status,
    enrollment: {
      id: enrollment.id,
      start_date: enrollment.start_date,
      syllabus: enrollment.syllabus,
    },
  }))

  // Filter students based on search query
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
    const email = student.email.toLowerCase()
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || email.includes(query)
  })

  // Get initials for avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  if (!enrollments || enrollments.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-6 text-center">
        <p className="text-muted-foreground mb-4">No students found</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/instructor/students/new">Enroll New Student</Link>
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button asChild size="sm">
          <Link href="/instructor/students/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Enroll New Student
          </Link>
        </Button>
      </div>

      {filteredStudents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <p className="text-muted-foreground mb-4">No students found</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/instructor/students/new">Enroll New Student</Link>
          </Button>
        </Card>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Training Program</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={student.avatar_url || ""}
                          alt={`${student.first_name} ${student.last_name}`}
                        />
                        <AvatarFallback>{getInitials(student.first_name, student.last_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.enrollment?.syllabus ? (
                      <div>
                        <p>{student.enrollment.syllabus.title}</p>
                        <p className="text-sm text-muted-foreground">{student.enrollment.syllabus.faa_type}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.enrollment?.start_date ? (
                      formatDate(student.enrollment.start_date)
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        student.status === "active"
                          ? "default"
                          : student.status === "inactive"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/instructor/students/${student.id}`}>View Details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
