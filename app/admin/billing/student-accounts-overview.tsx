"use client"

import { useState, useEffect } from "react"
import { getStudentAccountsOverview } from "@/lib/invoice-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Search,
  Plus,
  Eye,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  DollarSign
} from "lucide-react"

// Mock account data for reference
const mockAccounts = [
  {
    id: "1",
    student: {
      first_name: "John",
      last_name: "Smith", 
      email: "john@example.com"
    },
    current_balance: 1250.00,
    credit_limit: 2000.00,
    status: "active",
    low_balance_threshold: 200.00,
    last_transaction_date: "2024-01-15"
  },
  {
    id: "2",
    student: {
      first_name: "Sarah",
      last_name: "Johnson",
      email: "sarah@example.com"
    },
    current_balance: -150.00,
    credit_limit: 1500.00,
    status: "active", 
    low_balance_threshold: 200.00,
    last_transaction_date: "2024-01-14"
  },
  {
    id: "3",
    student: {
      first_name: "Mike",
      last_name: "Davis",
      email: "mike@example.com"
    },
    current_balance: 75.00,
    credit_limit: 1000.00,
    status: "active",
    low_balance_threshold: 200.00,
    last_transaction_date: "2024-01-13"
  }
]

export function StudentAccountsOverview() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchAccounts() {
      try {
        setLoading(true)
        setError(null)
        const data = await getStudentAccountsOverview()
        setAccounts(data)
      } catch (err) {
        console.error('Error fetching student accounts:', err)
        setError('Failed to load student accounts')
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [])

  const filteredAccounts = accounts.filter(account =>
    account.student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getBalanceStatus = (balance: number, threshold: number) => {
    if (balance < 0) return { status: "negative", color: "destructive", icon: AlertTriangle }
    if (balance < threshold) return { status: "low", color: "warning", icon: AlertTriangle }
    return { status: "good", color: "default", icon: CheckCircle }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading student accounts...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <AlertTriangle className="w-8 h-8 text-red-500 mr-2" />
          <span>Error loading accounts: {error}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Student Accounts</CardTitle>
            <CardDescription>
              Manage student account balances and credit limits
            </CardDescription>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Funds
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Accounts Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Credit Limit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.map((account) => {
              const balanceStatus = getBalanceStatus(account.current_balance, account.low_balance_threshold)
              const StatusIcon = balanceStatus.icon

              return (
                <TableRow key={account.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {account.student.first_name} {account.student.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {account.student.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-4 h-4" />
                      <span className={`font-mono ${
                        account.current_balance < 0 ? 'text-destructive' : 
                        account.current_balance < account.low_balance_threshold ? 'text-warning' : ''
                      }`}>
                        ${Math.abs(account.current_balance).toFixed(2)}
                        {account.current_balance < 0 && ' (owed)'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">${account.credit_limit.toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {new Date(account.last_transaction_date).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <DollarSign className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <CreditCard className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {filteredAccounts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No accounts found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

