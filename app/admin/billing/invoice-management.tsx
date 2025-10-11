"use client"

import { useState, useEffect } from "react"
import { getAllInvoices, type InvoiceData } from "@/lib/invoice-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Search,
  Plus,
  Eye,
  Send,
  Download,
  MoreHorizontal,
  Receipt,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"

// Use real invoice data from database
export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInvoices() {
      try {
        setLoading(true)
        setError(null)
        const data = await getAllInvoices()
        setInvoices(data)
      } catch (err) {
        console.error('Error fetching invoices:', err)
        setError('Failed to load invoices')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  const mockInvoices = [
  {
    id: "1",
    invoice_number: "INV-2024-001",
    student: {
      first_name: "John",
      last_name: "Smith",
      email: "john@example.com"
    },
    total_amount: 450.00,
    net_amount: 450.00,
    status: "sent",
    due_date: "2024-02-15",
    created_at: "2024-01-15",
    line_items: [
      { description: "Flight Training - Pattern Work", amount: 300.00 },
      { description: "Ground Instruction", amount: 150.00 }
    ]
  },
  {
    id: "2", 
    invoice_number: "INV-2024-002",
    student: {
      first_name: "Sarah",
      last_name: "Johnson",
      email: "sarah@example.com"
    },
    total_amount: 675.00,
    net_amount: 675.00,
    status: "overdue",
    due_date: "2024-01-30",
    created_at: "2024-01-01",
    paid_date: null
  },
  {
    id: "3",
    invoice_number: "INV-2024-003", 
    student: {
      first_name: "Mike",
      last_name: "Davis",
      email: "mike@example.com"
    },
    total_amount: 225.00,
    net_amount: 225.00,
    status: "paid",
    due_date: "2024-02-01",
    created_at: "2024-01-10",
    paid_date: "2024-01-25"
  }
]

export function InvoiceManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.student.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'sent': return <Clock className="w-4 h-4 text-blue-500" />
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'draft': return <Receipt className="w-4 h-4 text-gray-500" />
      default: return <Receipt className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default'
      case 'sent': return 'secondary'
      case 'overdue': return 'destructive'
      case 'draft': return 'outline'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading invoices...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <AlertCircle className="w-8 h-8 text-red-500 mr-2" />
          <span>Error loading invoices: {error}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invoice Management</CardTitle>
            <CardDescription>
              Create, send, and track student invoices
            </CardDescription>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoices Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {invoice.student.first_name} {invoice.student.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.student.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono">${invoice.net_amount.toFixed(2)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(invoice.status)}
                    <Badge variant={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </p>
                    {invoice.paid_date && (
                      <p className="text-sm text-green-600">
                        Paid: {new Date(invoice.paid_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {invoice.status === 'draft' && (
                      <Button variant="outline" size="sm">
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No invoices found</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {invoices.filter(i => i.status === 'sent').length}
            </p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {invoices.filter(i => i.status === 'overdue').length}
            </p>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {invoices.filter(i => i.status === 'paid').length}
            </p>
            <p className="text-sm text-muted-foreground">Paid</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              ${invoices.reduce((sum, inv) => sum + inv.net_amount, 0).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">Total Value</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
