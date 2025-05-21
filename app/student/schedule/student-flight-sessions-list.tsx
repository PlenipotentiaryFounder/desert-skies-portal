"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, Clock, MoreHorizontal, Plane, User } from "lucide-react"
import type { FlightSession } from "@/lib/flight-session-service"
import { formatDate, formatTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StudentFlightSessionsListProps {
  initialSessions: FlightSession[]
}

export function StudentFlightSessionsList({ initialSessions }: StudentFlightSessionsListProps) {
  const [sessions] = useState<FlightSession[]>(initialSessions)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Filter sessions based on search term and status
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.instructor?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.instructor?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.aircraft?.tail_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.lesson?.title.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || session.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "canceled":
        return "bg-red-100 text-red-800"
      case "no_show":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Search by instructor, aircraft, or lesson..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h3 className="mt-2 text-lg font-semibold">No flight sessions found</h3>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter"
              : "You don't have any flight sessions scheduled yet"}
          </p>
          <Button variant="outline" asChild>
            <Link href="/student/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date & Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Instructor</th>
                  <th className="hidden px-4 py-3 text-left text-sm font-medium text-muted-foreground md:table-cell">
                    Aircraft
                  </th>
                  <th className="hidden px-4 py-3 text-left text-sm font-medium text-muted-foreground lg:table-cell">
                    Lesson
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(session.date)}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="mr-2 h-4 w-4" />
                          <span>
                            {formatTime(session.start_time)} - {formatTime(session.end_time)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          {session.instructor?.first_name} {session.instructor?.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="flex items-center">
                        <Plane className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{session.aircraft?.tail_number}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="line-clamp-1">{session.lesson?.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusBadgeClass(
                          session.status,
                        )}`}
                      >
                        {session.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/student/schedule/${session.id}`}>View Details</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
