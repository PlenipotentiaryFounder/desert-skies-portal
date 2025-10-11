import {
  createPaymentIntent,
  processInvoicePayment,
  refundPayment,
  payFromAccountBalance,
  payFromPrepaidHours
} from '../payment-service'

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(() => Promise.resolve({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 15000,
        currency: 'usd',
        status: 'requires_payment_method'
      })),
      retrieve: jest.fn(() => Promise.resolve({
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 15000,
        metadata: { invoice_id: 'invoice-123' },
        application_fee_amount: 0
      }))
    },
    refunds: {
      create: jest.fn(() => Promise.resolve({
        id: 'ref_test_123',
        amount: 5000,
        status: 'succeeded'
      }))
    }
  }))
})

// Mock Supabase
jest.mock('../supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'invoice-123',
              student_id: 'student-123',
              instructor_id: 'instructor-123',
              total_amount: 150.00,
              status: 'draft',
              invoice_number: 'INV-2024-001',
              stripe_payment_intent_id: 'pi_test_123'
            },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'transaction-123' },
            error: null
          }))
        }))
      }))
    }))
  }))
}))

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      const paymentData = {
        amount: 15000, // $150.00 in cents
        currency: 'usd',
        customer_email: 'student@example.com',
        description: 'Flight instruction payment'
      }

      const result = await createPaymentIntent('invoice-123', paymentData)

      expect(result.success).toBe(true)
      expect(result.client_secret).toBeDefined()
      expect(result.error).toBeUndefined()
    })

    it('should handle Stripe errors', async () => {
      // Mock Stripe error
      const mockStripe = require('stripe')
      mockStripe.mockReturnValueOnce({
        paymentIntents: {
          create: jest.fn(() => Promise.reject(new Error('Stripe API error')))
        }
      })

      const paymentData = {
        amount: 15000,
        currency: 'usd',
        customer_email: 'student@example.com',
        description: 'Flight instruction payment'
      }

      const result = await createPaymentIntent('invoice-123', paymentData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Stripe API error')
    })
  })

  describe('processInvoicePayment', () => {
    it('should process payment successfully', async () => {
      const result = await processInvoicePayment('invoice-123', 'pi_test_123')

      expect(result.success).toBe(true)
      expect(result.payment_intent_id).toBe('pi_test_123')
      expect(result.message).toContain('processed successfully')
    })

    it('should reject payment with wrong amount', async () => {
      // Mock payment intent with wrong amount
      const mockStripe = require('stripe')
      mockStripe.mockReturnValueOnce({
        paymentIntents: {
          retrieve: jest.fn(() => Promise.resolve({
            id: 'pi_test_123',
            status: 'succeeded',
            amount: 10000, // Wrong amount
            metadata: { invoice_id: 'invoice-123' }
          }))
        }
      })

      const result = await processInvoicePayment('invoice-123', 'pi_test_123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('does not match invoice amount')
    })

    it('should handle failed payment intent', async () => {
      // Mock failed payment intent
      const mockStripe = require('stripe')
      mockStripe.mockReturnValueOnce({
        paymentIntents: {
          retrieve: jest.fn(() => Promise.resolve({
            id: 'pi_test_123',
            status: 'failed',
            metadata: { invoice_id: 'invoice-123' }
          }))
        }
      })

      const result = await processInvoicePayment('invoice-123', 'pi_test_123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Payment not completed')
    })
  })

  describe('refundPayment', () => {
    it('should process refund successfully', async () => {
      const result = await refundPayment('invoice-123', 50.00, 'Customer requested refund')

      expect(result.success).toBe(true)
      expect(result.message).toContain('processed successfully')
    })

    it('should handle refund for unpaid invoice', async () => {
      // Mock unpaid invoice
      const mockCreateClient = require('../supabase/server').createClient
      mockCreateClient.mockReturnValueOnce({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  id: 'invoice-123',
                  status: 'draft' // Not paid
                },
                error: null
              })
            })
          })
        })
      })

      const result = await refundPayment('invoice-123', 50.00)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not paid')
    })

    it('should handle missing payment intent for refund', async () => {
      // Mock invoice without payment intent
      const mockCreateClient = require('../supabase/server').createClient
      mockCreateClient.mockReturnValueOnce({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  id: 'invoice-123',
                  status: 'paid',
                  stripe_payment_intent_id: null // No payment intent
                },
                error: null
              })
            })
          })
        })
      })

      const result = await refundPayment('invoice-123', 50.00)

      expect(result.success).toBe(false)
      expect(result.error).toContain('No payment intent found')
    })
  })

  describe('payFromAccountBalance', () => {
    it('should process account balance payment successfully', async () => {
      const result = await payFromAccountBalance('invoice-123', 'student-123', 'instructor-123')

      expect(result.success).toBe(true)
      expect(result.message).toContain('processed from account balance')
    })

    it('should reject payment with insufficient balance', async () => {
      // Mock insufficient balance
      const mockCreateClient = require('../supabase/server').createClient
      mockCreateClient.mockReturnValueOnce({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  id: 'invoice-123',
                  total_amount: 200.00,
                  student_id: 'student-123',
                  instructor_id: 'instructor-123'
                },
                error: null
              })
            })
          })
        })
      }).mockReturnValueOnce({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  account_balance: 50.00 // Less than invoice amount
                },
                error: null
              })
            })
          })
        })
      })

      const result = await payFromAccountBalance('invoice-123', 'student-123', 'instructor-123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient account balance')
    })
  })

  describe('payFromPrepaidHours', () => {
    it('should process prepaid hours payment successfully', async () => {
      const result = await payFromPrepaidHours('invoice-123', 'student-123', 'instructor-123')

      expect(result.success).toBe(true)
      expect(result.message).toContain('processed using prepaid hours')
    })

    it('should reject payment with insufficient hours', async () => {
      // Mock insufficient hours
      const mockCreateClient = require('../supabase/server').createClient
      mockCreateClient.mockReturnValueOnce({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  id: 'invoice-123',
                  flight_hours: 3.0,
                  ground_hours: 2.0
                },
                error: null
              })
            })
          })
        })
      }).mockReturnValueOnce({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  prepaid_flight_hours: 1.0, // Less than required
                  prepaid_ground_hours: 1.0   // Less than required
                },
                error: null
              })
            })
          })
        })
      })

      const result = await payFromPrepaidHours('invoice-123', 'student-123', 'instructor-123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient prepaid hours')
    })
  })
})
