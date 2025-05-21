"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Edit, MoreHorizontal, Trash, Users } from "lucide-react"
import type { Enrollment } from "@/lib/enrollment-service"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { DeleteEnrollmentDialog } from "./delete-enrollment-dialog"

interface EnrollmentsListProps {
  enrollments: Enrollment[]
}

export function EnrollmentsList({ enrollments }: EnrollmentsListProps) {
  const [enrollmentToDelete, setEnrollmentToDelete] = useState<Enrollment | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Enrollments Found</h3>
        <p className="text-muted-foreground mb-4">There are no student enrollments in the system yet.</p>
        <Button onClick={() => router.push("/admin/enrollments/new")}>Create First Enrollment</Button>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "completed":
        return "bg-blue-500"
      case "withdrawn":
        return "bg-red-500"
      case "on_hold":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b">
          <div className="col-span-3">Student</div>
          <div className="col-span-3">Program</div>
          <div className="col-span-2">Instructor</div>
          <div className="col-span-1">Start Date</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1"></div>
        </div>

        {enrollments.map((enrollment) => (
          <div key={enrollment.id} className="grid grid-cols-12 gap-4 p-4 items-center border-b last:border-0">
            <div className="col-span-3">
              <div className="font-medium">
                {enrollment.student?.first_name} {enrollment.student?.last_name}
              </div>
              <div className="text-sm text-muted-foreground">{enrollment.student?.email}</div>
            </div>

            <div className="col-span-3">
              <div className="font-medium">{enrollment.syllabus?.title}</div>
              <div className="text-sm text-muted-foreground">{enrollment.syllabus?.faa_type}</div>
            </div>

            <div className="col-span-2">
              <div className="font-medium">
                {enrollment.instructor?.first_name} {enrollment.instructor?.last_name}
              </div>
            </div>

            <div className="col-span-1">{formatDate(enrollment.start_date)}</div>

            <div className="col-span-2">
              <Badge className="capitalize">
                <span className={`mr-1.5 h-2 w-2 rounded-full ${getStatusColor(enrollment.status)}`} />
                {enrollment.status.replace("_", " ")}
              </Badge>
            </div>

            <div className="col-span-1 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(`/admin/enrollments/${enrollment.id}`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setEnrollmentToDelete(enrollment)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      <DeleteEnrollmentDialog
        enrollment={enrollmentToDelete}
        open={enrollmentToDelete !== null}
        onOpenChange={() => setEnrollmentToDelete(null)}
      />
    </>
  )
}
