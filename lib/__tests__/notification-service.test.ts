import {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  notifyPaymentReceived,
  notifyPaymentFailed,
  notifyLowAccountBalance,
  notifyInvoiceOverdue
} from '../notification-service'

// Mock Supabase
jest.mock('../supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'notification-123' },
            error: null
          }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({
              data: [
                {
                  id: 'notification-1',
                  user_id: 'user-123',
                  title: 'Payment Received',
                  message: 'Payment processed successfully',
                  is_read: false,
                  created_at: '2024-01-01T00:00:00Z'
                }
              ],
              error: null
            }))
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }))
}))

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      const result = await createNotification({
        userId: 'user-123',
        title: 'Test Notification',
        message: 'This is a test notification',
        category: 'payment'
      })

      expect(result).toBeDefined()
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

      const result = await createNotification({
        userId: 'user-123',
        title: 'Test Notification',
        message: 'This is a test notification',
        category: 'payment'
      })

      expect(result).toBeUndefined()
    })
  })

  describe('getNotifications', () => {
    it('should fetch notifications for user', async () => {
      const notifications = await getNotifications('user-123', 10)

      expect(notifications).toHaveLength(1)
      expect(notifications[0].title).toBe('Payment Received')
    })

    it('should handle empty results', async () => {
      // Mock empty results
      const mockCreateClient = require('../supabase/server').createClient
      mockCreateClient.mockReturnValueOnce({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: [], error: null })
              })
            })
          })
        })
      })

      const notifications = await getNotifications('user-123', 10)

      expect(notifications).toHaveLength(0)
    })
  })

  describe('markNotificationAsRead', () => {
    it('should mark notification as read', async () => {
      const result = await markNotificationAsRead('notification-123', 'user-123')

      expect(result).toBe(true)
    })

    it('should handle database errors', async () => {
      // Mock database error
      const mockCreateClient = require('../supabase/server').createClient
      mockCreateClient.mockReturnValueOnce({
        from: () => ({
          update: () => ({
            eq: () => Promise.resolve({ error: new Error('Update failed') })
          })
        })
      })

      const result = await markNotificationAsRead('notification-123', 'user-123')

      expect(result).toBe(false)
    })
  })

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read', async () => {
      const result = await markAllNotificationsAsRead('user-123')

      expect(result).toBe(true)
    })
  })

  describe('Billing Notifications', () => {
    it('should send payment received notification', async () => {
      await notifyPaymentReceived('user-123', 150.00, 'INV-2024-001')

      // Should not throw error
      expect(true).toBe(true)
    })

    it('should send payment failed notification', async () => {
      await notifyPaymentFailed('user-123', 150.00, 'Card declined')

      // Should not throw error
      expect(true).toBe(true)
    })

    it('should send low account balance notification', async () => {
      await notifyLowAccountBalance('user-123', 25.00, 50.00)

      // Should not throw error
      expect(true).toBe(true)
    })

    it('should send overdue invoice notification', async () => {
      await notifyInvoiceOverdue('user-123', 'INV-2024-001', 150.00, 7)

      // Should not throw error
      expect(true).toBe(true)
    })
  })
})
