import {
  calculateAvailableHours,
  addAccountFunds,
  processFlexiblePayment,
  adjustFlightSession,
  getStudentInstructorAccount,
  createStudentInstructorAccount
} from '../instructor-billing-service'

// Mock Supabase client
jest.mock('../supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: null,
            error: { code: 'PGRST116' }
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'test-id',
              student_id: 'student-123',
              instructor_id: 'instructor-123',
              account_balance: 1000.00,
              account_type: 'flexible'
            },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    })),
    rpc: jest.fn(() => Promise.resolve({ data: 150.00, error: null }))
  }))
}))

describe('Instructor Billing Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculateAvailableHours', () => {
    it('should calculate hours correctly for flexible accounts', async () => {
      const result = await calculateAvailableHours('student-123', 'instructor-123')

      expect(result).toEqual({
        flight_hours: 0,
        ground_hours: 0,
        total_hours: 0
      })
    })

    it('should handle missing accounts gracefully', async () => {
      const result = await calculateAvailableHours('nonexistent', 'instructor')

      expect(result).toEqual({
        flight_hours: 0,
        ground_hours: 0,
        total_hours: 0
      })
    })
  })

  describe('addAccountFunds', () => {
    it('should add funds and return success', async () => {
      const result = await addAccountFunds('student-123', 'instructor-123', 500.00, 'credit_card', 'Test payment')

      expect(result.success).toBe(true)
      expect(result.transaction_id).toBeDefined()
    })

    it('should handle database errors', async () => {
      // Mock database error
      const mockCreateClient = require('../supabase/server').createClient
      mockCreateClient.mockReturnValueOnce({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ error: new Error('Database error') })
            })
          })
        })
      })

      const result = await addAccountFunds('student-123', 'instructor-123', 500.00, 'credit_card', 'Test payment')

      expect(result.success).toBe(false)
    })
  })

  describe('processFlexiblePayment', () => {
    it('should process payment successfully', async () => {
      const result = await processFlexiblePayment('student-123', 'instructor-123', 2.0, 1.0, 'Flight session payment')

      expect(result.success).toBe(true)
      expect(result.amount_deducted).toBeGreaterThan(0)
      expect(result.remaining_balance).toBeDefined()
    })

    it('should handle insufficient balance', async () => {
      // Mock insufficient balance
      const mockCreateClient = require('../supabase/server').createClient
      mockCreateClient.mockReturnValueOnce({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { account_balance: 50.00 },
                error: null
              })
            })
          })
        })
      })

      const result = await processFlexiblePayment('student-123', 'instructor-123', 2.0, 1.0, 'Flight session payment')

      expect(result.success).toBe(false)
      expect(result.remaining_balance).toBe(50.00)
    })
  })

  describe('adjustFlightSession', () => {
    it('should adjust session and handle refunds correctly', async () => {
      const result = await adjustFlightSession('session-123', 1.5, 0.5, 'Adjusted flight time', 'instructor-123')

      expect(result.success).toBe(true)
      expect(result.adjustments).toBeDefined()
      expect(result.adjustments.flight_hours_diff).toBeDefined()
      expect(result.adjustments.ground_hours_diff).toBeDefined()
    })

    it('should handle non-existent sessions', async () => {
      const mockCreateClient = require('../supabase/server').createClient
      mockCreateClient.mockReturnValueOnce({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } })
            })
          })
        })
      })

      const result = await adjustFlightSession('nonexistent', 1.5, 0.5, 'Test', 'instructor-123')

      expect(result.success).toBe(false)
    })
  })

  describe('Account Management', () => {
    it('should create new accounts with flexible type by default', async () => {
      const account = await createStudentInstructorAccount('student-123', 'instructor-123')

      expect(account.account_type).toBe('flexible')
      expect(account.account_balance).toBe(0.00)
    })

    it('should handle account creation errors', async () => {
      const mockCreateClient = require('../supabase/server').createClient
      mockCreateClient.mockReturnValueOnce({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ error: new Error('Creation failed') })
            })
          })
        })
      })

      await expect(createStudentInstructorAccount('student-123', 'instructor-123'))
        .rejects.toThrow('Failed to create instructor account')
    })
  })
})
