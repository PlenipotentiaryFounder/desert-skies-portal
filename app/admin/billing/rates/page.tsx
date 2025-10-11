import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getStudentInstructorRates } from "@/lib/instructor-billing-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  DollarSign,
  Plus,
  Edit,
  User,
  Plane,
  Clock
} from "lucide-react"
import Link from "next/link"
import { StudentRateManager } from "./student-rate-manager"

export const metadata = {
  title: "Student Instructor Rates | Desert Skies Aviation",
  description: "Manage hourly rates for each student-instructor pair",
}

async function getStudentsAndInstructors() {
  const supabase = await createClient(await cookies())

  // Get all students and instructors
  const [{ data: students }, { data: instructors }] = await Promise.all([
    supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, email,
        user_roles!inner(
          roles!inner(name)
        )
      `)
      .eq('user_roles.roles.name', 'student'),
    supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, email,
        user_roles!inner(
          roles!inner(name)
        )
      `)
      .eq('user_roles.roles.name', 'instructor')
  ])

  return { students: students || [], instructors: instructors || [] }
}

async function getRatesOverview() {
  const supabase = await createClient(await cookies())

  // Get rate statistics
  const { data: rates } = await supabase
    .from('student_instructor_rates')
    .select(`
      *,
      student:student_id(first_name, last_name, email),
      instructor:instructor_id(first_name, last_name, email)
    `)
    .eq('is_active', true)

  const totalRates = rates?.length || 0
  const defaultRates = rates?.filter(r => r.flight_instruction_rate === 75 && r.ground_instruction_rate === 75).length || 0
  const customRates = totalRates - defaultRates
  const avgFlightRate = rates?.reduce((sum, r) => sum + r.flight_instruction_rate, 0) / totalRates || 0
  const avgGroundRate = rates?.reduce((sum, r) => sum + r.ground_instruction_rate, 0) / totalRates || 0

  return {
    totalRates,
    defaultRates,
    customRates,
    avgFlightRate,
    avgGroundRate,
    rates: rates || []
  }
}

export default async function AdminRatesPage() {
  const [{ students, instructors }, ratesOverview] = await Promise.all([
    getStudentsAndInstructors(),
    getRatesOverview()
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Instructor Rates</h1>
          <p className="text-muted-foreground">
            Manage hourly rates for each student-instructor pair
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/billing/rates/new">
            <Plus className="w-4 h-4 mr-2" />
            Set Custom Rate
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Rates</p>
                <p className="text-2xl font-bold">{ratesOverview.totalRates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Default Rates</p>
                <p className="text-2xl font-bold">{ratesOverview.defaultRates}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Custom Rates</p>
                <p className="text-2xl font-bold">{ratesOverview.customRates}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Flight Rate</p>
                <p className="text-2xl font-bold">${ratesOverview.avgFlightRate.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Ground Rate</p>
                <p className="text-2xl font-bold">${ratesOverview.avgGroundRate.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Default Rate Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">Default Rate: $75.00/hour</p>
              <p className="text-sm text-blue-600">
                All students default to $75/hour for both flight and ground instruction unless custom rates are set.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Management */}
      <Suspense fallback={<div>Loading rates...</div>}>
        <StudentRateManager 
          students={students} 
          instructors={instructors} 
          existingRates={ratesOverview.rates}
        />
      </Suspense>

      {/* Current Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Student Rates</CardTitle>
          <CardDescription>
            All active student-instructor rate configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ratesOverview.rates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No custom rates set. All students use default $75/hour rate.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Flight Rate</TableHead>
                  <TableHead>Ground Rate</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratesOverview.rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {rate.student?.first_name} {rate.student?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {rate.student?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {rate.instructor?.first_name} {rate.instructor?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {rate.instructor?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">${rate.flight_instruction_rate.toFixed(2)}/hr</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">${rate.ground_instruction_rate.toFixed(2)}/hr</span>
                    </TableCell>
                    <TableCell>
                      {new Date(rate.effective_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rate.is_active ? "default" : "secondary"}>
                        {rate.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
