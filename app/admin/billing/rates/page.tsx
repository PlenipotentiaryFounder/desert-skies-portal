"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { SquarePen, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { EditStudentRatesModal } from "@/components/admin/billing/edit-student-rates-modal"
import { getStudentInstructorRates } from "@/lib/instructor-billing-service"
import type { StudentInstructorRate } from "@/lib/instructor-billing-service"

export default function RatesPage() {
  const { toast } = useToast()
  const [rates, setRates] = useState<StudentInstructorRate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRate, setSelectedRate] = useState<StudentInstructorRate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadRates()
  }, [])

  async function loadRates() {
    try {
      setIsLoading(true)
      const data = await getStudentInstructorRates()
      setRates(data)
    } catch (error) {
      console.error("Error loading rates:", error)
      toast({
        title: "Error",
        description: "Failed to load student rates. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleEditRate(rate: StudentInstructorRate) {
    setSelectedRate(rate)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Student Rates</h2>
      </div>

      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead className="text-right">Flight Rate</TableHead>
                <TableHead className="text-right">Ground Rate</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No rates found
                  </TableCell>
                </TableRow>
              ) : (
                rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>
                      {rate.student?.first_name} {rate.student?.last_name}
                      <br />
                      <span className="text-sm text-gray-500">
                        {rate.student?.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      {rate.instructor?.first_name} {rate.instructor?.last_name}
                      <br />
                      <span className="text-sm text-gray-500">
                        {rate.instructor?.email}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      ${rate.flight_instruction_rate.toFixed(2)}/hr
                    </TableCell>
                    <TableCell className="text-right">
                      ${rate.ground_instruction_rate.toFixed(2)}/hr
                    </TableCell>
                    <TableCell>
                      {format(new Date(rate.effective_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={rate.is_active ? "success" : "secondary"}
                      >
                        {rate.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleEditRate(rate)}
                        className="group relative inline-flex h-9 items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-aviation-sunset-200 bg-white/5 px-4 py-2 text-xs font-semibold text-aviation-sunset-300 ring-offset-background transition-all duration-300 hover:scale-105 hover:border-aviation-sunset-300 hover:bg-aviation-sunset-50/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                      >
                        <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
                        <span className="relative flex items-center gap-2">
                          <SquarePen className="h-4 w-4" />
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedRate && (
        <EditStudentRatesModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedRate(null)
          }}
          studentId={selectedRate.student_id}
          instructorId={selectedRate.instructor_id}
          currentRate={selectedRate}
          onRateUpdated={loadRates}
        />
      )}
    </div>
  )
}