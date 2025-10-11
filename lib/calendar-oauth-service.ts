
import { createClient } from "@/lib/supabase/client"

// OAuth Provider Configuration
const OAUTH_CONFIG = {
  google: {
    clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google-calendar`
  },
  outlook: {
    clientId: process.env.OUTLOOK_CALENDAR_CLIENT_ID!,
    clientSecret: process.env.OUTLOOK_CALENDAR_CLIENT_VALUE!,
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scope: "https://graph.microsoft.com/Calendars.ReadWrite",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/outlook-calendar`
  }
  // Apple Calendar integration would go here but requires more complex setup
}

export type OAuthProvider = keyof typeof OAUTH_CONFIG

export interface OAuthTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  token_type?: string
}

export interface CalendarConnection {
  id: string
  user_id: string
  provider: OAuthProvider
  provider_account_id?: string
  access_token: string
  refresh_token?: string
  expires_at?: string
  scope?: string
  connected_at: string
  last_sync_at?: string
  sync_status: 'active' | 'paused' | 'error'
  settings: Record<string, any>
}

export class CalendarOAuthService {
  // Generate OAuth authorization URL
  static generateAuthUrl(provider: OAuthProvider, state?: string): string {
    const config = OAUTH_CONFIG[provider]

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: config.scope,
      access_type: "offline", // For Google - get refresh token
      prompt: "consent"
    })

    if (state) {
      params.append("state", state)
    }

    return `${config.authUrl}?${params.toString()}`
  }

  // Exchange authorization code for access token
  static async exchangeCodeForToken(provider: OAuthProvider, code: string): Promise<OAuthTokenResponse> {
    const config = OAUTH_CONFIG[provider]

    const tokenData = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri
    })

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: tokenData
    })

    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Refresh access token
  static async refreshAccessToken(provider: OAuthProvider, refreshToken: string): Promise<OAuthTokenResponse> {
    const config = OAUTH_CONFIG[provider]

    const tokenData = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: tokenData
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Get user profile from provider (for account identification)
  static async getProviderProfile(provider: OAuthProvider, accessToken: string): Promise<any> {
    switch (provider) {
      case 'google':
        const googleResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        return googleResponse.json()

      case 'outlook':
        const outlookResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        return outlookResponse.json()

      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  // Client-side method to get stored access token (for immediate use)
  static getStoredAccessToken(connectionId: string): string | null {
    // This would need to be implemented with a client-side storage solution
    // For now, return null and handle token management through API routes
    return null
  }

  // Check if token refresh is needed (client-side check)
  static shouldRefreshToken(connection: CalendarConnection): boolean {
    if (!connection.expires_at) return false

    const expiresAt = new Date(connection.expires_at)
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)

    return expiresAt < fiveMinutesFromNow
  }
}
