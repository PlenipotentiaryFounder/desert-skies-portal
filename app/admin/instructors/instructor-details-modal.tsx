"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Award,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Plane,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  FileText,
  TrendingUp,
  Edit,
  Save,
  X,
  Send,
  UserPlus
} from "lucide-react"
import { AdminInstructorData, updateInstructorContact, updateInstructorCertifications, updateInstructorRates, sendStripeConnectEmail } from "@/lib/admin-instructor-service"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { AssignStudentDialog } from "./assign-student-dialog"

interface InstructorDetailsModalProps {
  instructor: AdminInstructorData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InstructorDetailsModal({ instructor, open, onOpenChange }: InstructorDetailsModalProps) {
  const [editingOverview, setEditingOverview] = useState(false)
  const [editingCertifications, setEditingCertifications] = useState(false)
  const [editingRates, setEditingRates] = useState(false)
  const [assignStudentOpen, setAssignStudentOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Overview form state
  const [overviewData, setOverviewData] = useState({
    phone_number: instructor.phone_number || '',
    address_line1: instructor.address_line1 || '',
    city: instructor.city || '',
    state: instructor.state || '',
  })

  // Certifications form state
  const [certsData, setCertsData] = useState({
    cfi: instructor.certifications.cfi,
    cfi_number: instructor.certifications.cfi_number || '',
    cfi_expiration: instructor.certifications.cfi_expiration || '',
    cfii: instructor.certifications.cfii,
    cfii_expiration: instructor.certifications.cfii_expiration || '',
    mei: instructor.certifications.mei,
    mei_expiration: instructor.certifications.mei_expiration || '',
  })

  // Rates form state
  const [ratesData, setRatesData] = useState({
    flight_rate: instructor.rates.flight_instruction_payout / 100,
    ground_rate: instructor.rates.ground_instruction_payout / 100,
  })

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(cents / 100)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return 'Invalid date'
    }
  }

  const getCertExpirationStatus = (expirationDate: string | null) => {
    if (!expirationDate) return { status: 'unknown', text: 'No expiration', color: 'gray' }
    
    const exp = new Date(expirationDate)
    const now = new Date()
    const daysUntilExpiration = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiration < 0) {
      return { status: 'expired', text: 'Expired', color: 'red' }
    } else if (daysUntilExpiration < 30) {
      return { status: 'expiring', text: 'Expiring Soon', color: 'yellow' }
    }
    return { status: 'valid', text: 'Valid', color: 'green' }
  }

  const handleSaveOverview = async () => {
    try {
      await updateInstructorContact(instructor.id, overviewData)
      toast({
        title: "Contact Information Updated",
        description: "Instructor contact information has been successfully updated.",
      })
      setEditingOverview(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating contact:', error)
      toast({
        title: "Error",
        description: "Failed to update contact information. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveCertifications = async () => {
    try {
      await updateInstructorCertifications(instructor.id, {
        cfi_certificate_number: certsData.cfi && certsData.cfi_number ? certsData.cfi_number : null,
        cfi_expiration_date: certsData.cfi && certsData.cfi_expiration ? certsData.cfi_expiration : null,
        cfii_certificate: certsData.cfii,
        cfii_expiration_date: certsData.cfii && certsData.cfii_expiration ? certsData.cfii_expiration : null,
        mei_certificate: certsData.mei,
        mei_expiration_date: certsData.mei && certsData.mei_expiration ? certsData.mei_expiration : null,
      })
      toast({
        title: "Certifications Updated",
        description: "Instructor certifications have been successfully updated.",
      })
      setEditingCertifications(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating certifications:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update certifications. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveRates = async () => {
    try {
      // Validate rates
      if (!ratesData.flight_rate || !ratesData.ground_rate || 
          isNaN(ratesData.flight_rate) || isNaN(ratesData.ground_rate) ||
          ratesData.flight_rate < 0 || ratesData.ground_rate < 0) {
        toast({
          title: "Invalid Rates",
          description: "Please enter valid positive numbers for both rates.",
          variant: "destructive",
        })
        return
      }
      
      const flightCents = Math.round(ratesData.flight_rate * 100)
      const groundCents = Math.round(ratesData.ground_rate * 100)
      
      // TODO: Get actual admin ID from session
      const adminId = instructor.id // Using instructor ID as fallback for now
      
      await updateInstructorRates(instructor.id, flightCents, groundCents, adminId)
      toast({
        title: "Rates Updated",
        description: "Instructor payout rates have been successfully updated.",
      })
      setEditingRates(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating rates:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update rates. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSendStripeEmail = async () => {
    try {
      const instructorName = `${instructor.first_name} ${instructor.last_name}`
      await sendStripeConnectEmail(instructor.id, instructor.email, instructorName)
      toast({
        title: "Email Sent",
        description: `Stripe Connect setup email has been sent to ${instructor.email}`,
      })
    } catch (error) {
      console.error('Error sending Stripe email:', error)
      toast({
        title: "Error",
        description: "Failed to send Stripe Connect email. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">
                  {instructor.first_name?.[0]}{instructor.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl">
                  {instructor.first_name} {instructor.last_name}
                </DialogTitle>
                <DialogDescription>{instructor.email}</DialogDescription>
                <div className="flex gap-2 mt-2">
                  {instructor.certifications.cfi && <Badge key={`${instructor.id}-modal-cfi`}>CFI</Badge>}
                  {instructor.certifications.cfii && <Badge key={`${instructor.id}-modal-cfii`}>CFII</Badge>}
                  {instructor.certifications.mei && <Badge key={`${instructor.id}-modal-mei`}>MEI</Badge>}
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="mt-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="rates">Rates</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Contact Information</CardTitle>
                    {!editingOverview ? (
                      <Button variant="outline" size="sm" onClick={() => setEditingOverview(true)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingOverview(false)}>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveOverview}>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!editingOverview ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{instructor.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{instructor.phone_number || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {instructor.address_line1 || 'Not provided'}
                          {instructor.city && `, ${instructor.city}`}
                          {instructor.state && `, ${instructor.state}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Joined {formatDate(instructor.created_at)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={overviewData.phone_number}
                          onChange={(e) => setOverviewData({...overviewData, phone_number: e.target.value})}
                          placeholder="(555) 555-5555"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={overviewData.address_line1}
                          onChange={(e) => setOverviewData({...overviewData, address_line1: e.target.value})}
                          placeholder="123 Main St"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={overviewData.city}
                            onChange={(e) => setOverviewData({...overviewData, city: e.target.value})}
                            placeholder="Phoenix"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={overviewData.state}
                            onChange={(e) => setOverviewData({...overviewData, state: e.target.value})}
                            placeholder="AZ"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 text-muted-foreground" />
                      <span>Total Flight Hours</span>
                    </div>
                    <span className="font-bold">{instructor.experience.total_flight_hours.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span>Total Instruction Hours</span>
                    </div>
                    <span className="font-bold">{instructor.experience.total_instruction_hours.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>Hours Taught (Platform)</span>
                    </div>
                    <span className="font-bold">{instructor.recent_activity.total_flight_hours_taught.toFixed(1)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Onboarding Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Onboarding Completed</span>
                    {instructor.onboarding.completed ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" /> Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        <Clock className="h-3 w-3 mr-1" /> In Progress
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Admin Approved</span>
                    {instructor.onboarding.admin_approved ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" /> Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        <XCircle className="h-3 w-3 mr-1" /> No
                      </Badge>
                    )}
                  </div>
                  {instructor.onboarding.admin_approved_at && (
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Approved On</span>
                      <span>{formatDate(instructor.onboarding.admin_approved_at)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Stripe Connect</CardTitle>
                    {!instructor.stripe_connect.onboarding_complete && (
                      <Button size="sm" onClick={handleSendStripeEmail}>
                        <Send className="h-4 w-4 mr-1" />
                        Send Setup Email
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Onboarding Complete</span>
                    {instructor.stripe_connect.onboarding_complete ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" /> Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        <AlertCircle className="h-3 w-3 mr-1" /> Incomplete
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Charges Enabled</span>
                    {instructor.stripe_connect.charges_enabled ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">Yes</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700">No</Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payouts Enabled</span>
                    {instructor.stripe_connect.payouts_enabled ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">Yes</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700">No</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certifications" className="space-y-4">
              <div className="flex justify-end mb-4">
                {!editingCertifications ? (
                  <Button variant="outline" size="sm" onClick={() => setEditingCertifications(true)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Certifications
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingCertifications(false)}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveCertifications}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </div>

              {!editingCertifications ? (
                <>
                  {instructor.certifications.cfi && (
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>Certified Flight Instructor (CFI)</CardTitle>
                          <Badge {...(getCertExpirationStatus(instructor.certifications.cfi_expiration).status === 'valid' ? { variant: "outline", className: "bg-green-50 text-green-700" } : { variant: "destructive" })}>
                            {getCertExpirationStatus(instructor.certifications.cfi_expiration).text}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Certificate Number</span>
                          <span className="font-mono">{instructor.certifications.cfi_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expiration Date</span>
                          <span>{formatDate(instructor.certifications.cfi_expiration)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {instructor.certifications.cfii && (
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>Certified Flight Instructor - Instrument (CFII)</CardTitle>
                          <Badge {...(getCertExpirationStatus(instructor.certifications.cfii_expiration).status === 'valid' ? { variant: "outline", className: "bg-green-50 text-green-700" } : { variant: "destructive" })}>
                            {getCertExpirationStatus(instructor.certifications.cfii_expiration).text}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expiration Date</span>
                          <span>{formatDate(instructor.certifications.cfii_expiration)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {instructor.certifications.mei && (
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>Multi-Engine Instructor (MEI)</CardTitle>
                          <Badge {...(getCertExpirationStatus(instructor.certifications.mei_expiration).status === 'valid' ? { variant: "outline", className: "bg-green-50 text-green-700" } : { variant: "destructive" })}>
                            {getCertExpirationStatus(instructor.certifications.mei_expiration).text}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expiration Date</span>
                          <span>{formatDate(instructor.certifications.mei_expiration)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Certifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4 border-b pb-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="cfi"
                          checked={certsData.cfi}
                          onCheckedChange={(checked) => setCertsData({...certsData, cfi: !!checked})}
                        />
                        <Label htmlFor="cfi" className="font-semibold">Certified Flight Instructor (CFI)</Label>
                      </div>
                      {certsData.cfi && (
                        <div className="ml-6 space-y-3">
                          <div>
                            <Label htmlFor="cfi_number">Certificate Number</Label>
                            <Input
                              id="cfi_number"
                              value={certsData.cfi_number}
                              onChange={(e) => setCertsData({...certsData, cfi_number: e.target.value})}
                              placeholder="CFI123456"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cfi_exp">Expiration Date</Label>
                            <Input
                              id="cfi_exp"
                              type="date"
                              value={certsData.cfi_expiration}
                              onChange={(e) => setCertsData({...certsData, cfi_expiration: e.target.value})}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 border-b pb-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="cfii"
                          checked={certsData.cfii}
                          onCheckedChange={(checked) => setCertsData({...certsData, cfii: !!checked})}
                        />
                        <Label htmlFor="cfii" className="font-semibold">Certified Flight Instructor - Instrument (CFII)</Label>
                      </div>
                      {certsData.cfii && (
                        <div className="ml-6">
                          <Label htmlFor="cfii_exp">Expiration Date</Label>
                          <Input
                            id="cfii_exp"
                            type="date"
                            value={certsData.cfii_expiration}
                            onChange={(e) => setCertsData({...certsData, cfii_expiration: e.target.value})}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="mei"
                          checked={certsData.mei}
                          onCheckedChange={(checked) => setCertsData({...certsData, mei: !!checked})}
                        />
                        <Label htmlFor="mei" className="font-semibold">Multi-Engine Instructor (MEI)</Label>
                      </div>
                      {certsData.mei && (
                        <div className="ml-6">
                          <Label htmlFor="mei_exp">Expiration Date</Label>
                          <Input
                            id="mei_exp"
                            type="date"
                            value={certsData.mei_expiration}
                            onChange={(e) => setCertsData({...certsData, mei_expiration: e.target.value})}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Pilot Certificate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span>{instructor.certifications.pilot_certificate_type || 'Not specified'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Medical Certificate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Class</span>
                    <span>{instructor.certifications.medical_class || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expiration Date</span>
                    <span>{formatDate(instructor.certifications.medical_expiration)}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="space-y-4">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setAssignStudentOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Assign Student
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{instructor.students.total_count}</div>
                    <p className="text-sm text-muted-foreground mt-2">All-time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-green-600">{instructor.students.active_count}</div>
                    <p className="text-sm text-muted-foreground mt-2">Currently enrolled</p>
                  </CardContent>
                </Card>
              </div>

              {instructor.students.recent_students.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Students</CardTitle>
                    <CardDescription>Most recently enrolled students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {instructor.students.recent_students.map((student) => (
                        <div key={student.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {student.first_name?.[0]}{student.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">{student.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rates" className="space-y-4">
              <div className="flex justify-end mb-4">
                {!editingRates ? (
                  <Button variant="outline" size="sm" onClick={() => setEditingRates(true)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Rates
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingRates(false)}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveRates}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Instructor Payout Rates</CardTitle>
                  <CardDescription>What the instructor receives per hour</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!editingRates ? (
                    <>
                      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium">Flight Instruction</div>
                          <div className="text-sm text-muted-foreground">Per hour rate</div>
                        </div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(instructor.rates.flight_instruction_payout)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium">Ground Instruction</div>
                          <div className="text-sm text-muted-foreground">Per hour rate</div>
                        </div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(instructor.rates.ground_instruction_payout)}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="flight_rate">Flight Instruction Rate ($/hr)</Label>
                        <Input
                          id="flight_rate"
                          type="number"
                          step="0.01"
                          value={ratesData.flight_rate}
                          onChange={(e) => setRatesData({...ratesData, flight_rate: parseFloat(e.target.value)})}
                          placeholder="75.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ground_rate">Ground Instruction Rate ($/hr)</Label>
                        <Input
                          id="ground_rate"
                          type="number"
                          step="0.01"
                          value={ratesData.ground_rate}
                          onChange={(e) => setRatesData({...ratesData, ground_rate: parseFloat(e.target.value)})}
                          placeholder="60.00"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Student Rate</CardTitle>
                  <CardDescription>Average rate charged to students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">
                    ${Math.round(instructor.rates.average_student_rate)}/hr
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    This is the average rate students are charged for flight instruction
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Missions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{instructor.recent_activity.total_missions}</div>
                    <p className="text-sm text-muted-foreground mt-2">Completed missions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Hours Taught</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">
                      {instructor.recent_activity.total_flight_hours_taught.toFixed(1)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Total flight hours taught</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Last Flight</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg">
                      {instructor.recent_activity.last_flight_date 
                        ? formatDate(instructor.recent_activity.last_flight_date)
                        : 'No flights recorded'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => window.location.href = `mailto:${instructor.email}`}>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AssignStudentDialog
        open={assignStudentOpen}
        onOpenChange={setAssignStudentOpen}
        instructorId={instructor.id}
        instructorName={`${instructor.first_name} ${instructor.last_name}`}
      />
    </>
  )
}
