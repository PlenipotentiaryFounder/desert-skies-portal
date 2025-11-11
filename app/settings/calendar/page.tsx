"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarOAuthService } from "@/lib/calendar-oauth-service"
import { CalendarService } from "@/lib/calendar-service"
import { CalendarSyncService } from "@/lib/calendar-sync-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Plus,
  Settings,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Plane
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CalendarConnection {
  id: string
  provider: 'google' | 'outlook' | 'apple'
  provider_account_id?: string
  connected_at: string
  last_sync_at?: string
  sync_status: 'active' | 'paused' | 'error'
  settings: Record<string, any>
}

interface SyncLog {
  operation: string
  status: string
  records_processed: number
  started_at: string
  completed_at?: string
  errors: string[]
}

function CalendarSettingsContent() {
  const [connections, setConnections] = useState<CalendarConnection[]>([])
  const [syncLogs, setSyncLogs] = useState<Record<string, SyncLog[]>>({})
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    loadCalendarConnections()

    // Handle success/error messages from OAuth callbacks
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const provider = searchParams.get('provider')

    if (success) {
      toast({
        title: "Calendar Connected",
        description: `Successfully connected to ${provider === 'google' ? 'Google Calendar' : 'Outlook Calendar'}`,
      })
      // Clear the query params
      router.replace('/settings/calendar')
    }

    if (error) {
      toast({
        title: "Connection Failed",
        description: error === 'oauth_failed' ? 'Failed to connect calendar. Please try again.' :
                   error === 'no_code' ? 'Authorization code missing. Please try again.' :
                   error === 'oauth_callback_failed' ? 'Calendar connection callback failed.' :
                   'An error occurred while connecting your calendar.',
        variant: "destructive"
      })
      router.replace('/settings/calendar')
    }
  }, [searchParams, router, toast])

  const loadCalendarConnections = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get calendar connections via API
      const response = await fetch('/api/calendar/connections')
      if (!response.ok) throw new Error('Failed to load calendar connections')

      const connectionsData = await response.json()
      setConnections(connectionsData)

      // Load sync logs for each connection
      const logs: Record<string, SyncLog[]> = {}
      for (const connection of connectionsData) {
        try {
          const logsResponse = await fetch(`/api/calendar/connections/${connection.id}/logs`)
          if (logsResponse.ok) {
            logs[connection.id] = await logsResponse.json()
          }
        } catch (logError) {
          console.error(`Failed to load logs for connection ${connection.id}:`, logError)
        }
      }
      setSyncLogs(logs)

    } catch (error) {
      console.error('Failed to load calendar connections:', error)
      setError('Failed to load calendar connections')
    } finally {
      setLoading(false)
    }
  }

  const connectCalendar = (provider: 'google' | 'outlook') => {
    const authUrl = CalendarOAuthService.generateAuthUrl(provider)
    window.location.href = authUrl
  }

  const disconnectCalendar = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/calendar/connections/${connectionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to disconnect calendar')

      toast({
        title: "Calendar Disconnected",
        description: "Calendar connection has been removed successfully.",
      })

      await loadCalendarConnections()
    } catch (error) {
      console.error('Failed to disconnect calendar:', error)
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect calendar. Please try again.",
        variant: "destructive"
      })
    }
  }

  const triggerManualSync = async (connectionId: string) => {
    try {
      setSyncing(connectionId)

      const response = await fetch(`/api/calendar/sync/${connectionId}`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to trigger sync')

      const result = await response.json()

      toast({
        title: "Sync Completed",
        description: `Processed ${result.records_processed} records${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`,
        variant: result.success ? "default" : "destructive"
      })

      await loadCalendarConnections()
    } catch (error) {
      console.error('Failed to trigger manual sync:', error)
      toast({
        title: "Sync Failed",
        description: "Failed to sync calendar. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSyncing(null)
    }
  }

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'google': return 'Google Calendar'
      case 'outlook': return 'Outlook Calendar'
      case 'apple': return 'Apple Calendar'
      default: return provider
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google': return '📅'
      case 'outlook': return '📧'
      case 'apple': return '🍎'
      default: return '📅'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'paused':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Paused</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading calendar settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Calendar Integration
        </h1>
        <p className="text-muted-foreground mt-2">
          Connect your external calendars to automatically sync flight sessions and other events.
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connections">Connected Calendars</TabsTrigger>
          <TabsTrigger value="sync">Sync Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          {/* Available Calendar Providers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Available Calendar Providers
              </CardTitle>
              <CardDescription>
                Connect your external calendars to enable automatic synchronization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => connectCalendar('google')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📅</div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Google Calendar</h3>
                        <p className="text-sm text-muted-foreground">
                          Sync with your Google Calendar for seamless flight session management.
                        </p>
                      </div>
                      <Button size="sm">Connect</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => connectCalendar('outlook')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📧</div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Outlook Calendar</h3>
                        <p className="text-sm text-muted-foreground">
                          Connect your Microsoft Outlook calendar to sync flight sessions.
                        </p>
                      </div>
                      <Button size="sm">Connect</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Connected Calendars */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Connected Calendars
              </CardTitle>
              <CardDescription>
                Manage your connected calendars and sync settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No calendars connected yet.</p>
                  <p className="text-sm">Connect a calendar provider above to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {connections.map((connection) => (
                    <Card key={connection.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">
                              {getProviderIcon(connection.provider)}
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {getProviderDisplayName(connection.provider)}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Connected {new Date(connection.connected_at).toLocaleDateString()}
                                {connection.last_sync_at && (
                                  <> • Last synced {new Date(connection.last_sync_at).toLocaleDateString()}</>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {getStatusBadge(connection.sync_status)}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => triggerManualSync(connection.id)}
                              disabled={syncing === connection.id}
                            >
                              <RefreshCw className={`h-4 w-4 mr-2 ${syncing === connection.id ? 'animate-spin' : ''}`} />
                              {syncing === connection.id ? 'Syncing...' : 'Sync Now'}
                            </Button>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => disconnectCalendar(connection.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Disconnect
                            </Button>
                          </div>
                        </div>

                        {/* Sync Logs */}
                        {syncLogs[connection.id] && syncLogs[connection.id].length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="font-medium mb-2">Recent Sync Activity</h4>
                            <div className="space-y-2">
                              {syncLogs[connection.id].slice(0, 3).map((log, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                                      {log.operation}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                      {new Date(log.started_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">
                                      {log.records_processed} records
                                    </span>
                                    {log.status === 'error' && (
                                      <AlertCircle className="h-3 w-3 text-destructive" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Sync Settings
              </CardTitle>
              <CardDescription>
                Configure how your calendars sync with flight sessions and external events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Flight Session Export</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Automatically export flight sessions to your connected calendars.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Export new flight sessions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Update existing events when sessions change</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Remove events when sessions are cancelled</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">External Event Import</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Import external calendar events to avoid scheduling conflicts.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Import non-flight events from external calendars</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Conflict detection for overlapping events</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Visual distinction between flight and external events</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Sync Frequency</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure how often your calendars are synchronized.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <h4 className="font-semibold">Real-time</h4>
                      <p className="text-sm text-muted-foreground">
                        Sync immediately when changes occur (recommended)
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                      <h4 className="font-semibold">Hourly</h4>
                      <p className="text-sm text-muted-foreground">
                        Sync every hour for less frequent updates
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                      <h4 className="font-semibold">Manual</h4>
                      <p className="text-sm text-muted-foreground">
                        Sync only when manually triggered
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function CalendarSettingsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading calendar settings...</span>
        </div>
      </div>
    }>
      <CalendarSettingsContent />
    </Suspense>
  )
}
