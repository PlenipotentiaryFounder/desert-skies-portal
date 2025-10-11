// Invoice service for fetching and managing invoice data
// Integrates with instructor_invoices and student_invoices tables

export interface InvoiceData {
  id: string
  invoice_number: string
  student?: {
    first_name: string
    last_name: string
    email: string
  }
  instructor?: {
    first_name: string
    last_name: string
    email: string
  }
  total_amount: number
  net_amount?: number
  status: string
  due_date: string
  created_at: string
  paid_date?: string
  line_items?: Array<{
    description: string
    amount: number
  }>
  type: 'instructor' | 'student'
}

/**
 * Fetch all invoices for admin view (both instructor and student invoices)
 * @returns Array of invoice data
 */
export async function getAllInvoices(): Promise<InvoiceData[]> {
  try {
    // TODO: Fetch from both instructor_invoices and student_invoices tables
    // For now, return demo data
    return [
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
        ],
        type: 'instructor'
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
        paid_date: null,
        type: 'instructor'
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
        paid_date: "2024-01-25",
        type: 'student'
      }
    ]
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return []
  }
}

/**
 * Fetch student account overview data
 * @returns Array of student account data
 */
export async function getStudentAccountsOverview(): Promise<Array<{
  id: string
  student: {
    first_name: string
    last_name: string
    email: string
  }
  current_balance: number
  credit_limit: number
  status: string
  low_balance_threshold: number
  last_transaction_date: string
}>> {
  try {
    // TODO: Fetch from student_invoices and related billing data
    // For now, return demo data
    return [
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
  } catch (error) {
    console.error('Error fetching student accounts:', error)
    return []
  }
}

/**
 * Fetch invoices for a specific student
 * @param studentId - Student ID to fetch invoices for
 * @returns Array of student invoice data
 */
export async function getStudentInvoices(studentId: string): Promise<InvoiceData[]> {
  try {
    // TODO: Fetch from student_invoices table
    // For now, return demo data filtered for the student
    const allInvoices = await getAllInvoices()
    return allInvoices.filter(invoice => invoice.type === 'student')
  } catch (error) {
    console.error('Error fetching student invoices:', error)
    return []
  }
}

/**
 * Fetch invoices for a specific instructor
 * @param instructorId - Instructor ID to fetch invoices for
 * @returns Array of instructor invoice data
 */
export async function getInstructorInvoices(instructorId: string): Promise<InvoiceData[]> {
  try {
    // TODO: Fetch from instructor_invoices table
    // For now, return demo data filtered for the instructor
    const allInvoices = await getAllInvoices()
    return allInvoices.filter(invoice => invoice.type === 'instructor')
  } catch (error) {
    console.error('Error fetching instructor invoices:', error)
    return []
  }
}
