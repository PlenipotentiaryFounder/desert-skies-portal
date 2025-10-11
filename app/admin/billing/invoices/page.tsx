"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getInstructorInvoices } from "@/lib/instructor-billing-service"

type Invoice = {
  id: string
  invoice_number: string
  student: {
    first_name: string
    last_name: string
    email: string
  }
  instructor: {
    first_name: string
    last_name: string
    email: string
  }
  total_amount: number
  status: string
  created_at: string
  due_date: string
}

export default function InvoicesPage() {
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState<keyof Invoice>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    loadInvoices()
  }, [])

  async function loadInvoices() {
    try {
      setIsLoading(true)
      const data = await getInstructorInvoices()
      setInvoices(data)
    } catch (error) {
      console.error("Error loading invoices:", error)
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort invoices
  const filteredInvoices = invoices
    .filter((invoice) => {
      const searchMatch =
        searchTerm === "" ||
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${invoice.student.first_name} ${invoice.student.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

      const statusMatch =
        statusFilter === "all" || invoice.status === statusFilter

      return searchMatch && statusMatch
    })
    .sort((a, b) => {
      if (sortField === "total_amount") {
        return sortDirection === "asc"
          ? a.total_amount - b.total_amount
          : b.total_amount - a.total_amount
      }

      const aValue = a[sortField]
      const bValue = b[sortField]

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  function toggleSort(field: keyof Invoice) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "draft":
        return "bg-gray-500"
      case "sent":
        return "bg-blue-500"
      case "paid":
        return "bg-green-500"
      case "overdue":
        return "bg-red-500"
      case "cancelled":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
        <Link href="/admin/billing/invoices/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-aviation-sunset-300" />
          <Input
            placeholder="Search invoices..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("invoice_number")}
              >
                Invoice #
                {sortField === "invoice_number" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? (
                      <ChevronUpIcon className="inline h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="inline h-4 w-4" />
                    )}
                  </span>
                )}
              </TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("total_amount")}
              >
                Amount
                {sortField === "total_amount" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? (
                      <ChevronUpIcon className="inline h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="inline h-4 w-4" />
                    )}
                  </span>
                )}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("created_at")}
              >
                Created
                {sortField === "created_at" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? (
                      <ChevronUpIcon className="inline h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="inline h-4 w-4" />
                    )}
                  </span>
                )}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("due_date")}
              >
                Due Date
                {sortField === "due_date" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? (
                      <ChevronUpIcon className="inline h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="inline h-4 w-4" />
                    )}
                  </span>
                )}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading invoices...
                </TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>
                    {invoice.student.first_name} {invoice.student.last_name}
                    <br />
                    <span className="text-sm text-aviation-sunset-300">
                      {invoice.student.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    {invoice.instructor.first_name} {invoice.instructor.last_name}
                    <br />
                    <span className="text-sm text-aviation-sunset-300">
                      {invoice.instructor.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    ${invoice.total_amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={getStatusColor(invoice.status)}
                    >
                      {invoice.status.charAt(0).toUpperCase() +
                        invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.due_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/billing/invoices/${invoice.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
