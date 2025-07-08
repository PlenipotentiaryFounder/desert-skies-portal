"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    
    // Handle ChunkLoadError specifically
    if (error.name === "ChunkLoadError" || error.message.includes("Loading chunk")) {
      // Automatically retry after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
    
    this.setState({
      error,
      errorInfo,
    })
  }

  retry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state
      const isChunkError = error?.name === "ChunkLoadError" || error?.message.includes("Loading chunk")
      
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={error!} retry={this.retry} />
      }

      return (
        <Card className="max-w-lg mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {isChunkError ? "Loading Error" : "Something went wrong"}
            </CardTitle>
            <CardDescription>
              {isChunkError 
                ? "Failed to load application resources. This usually happens after an update."
                : "An unexpected error occurred while rendering this page."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isChunkError ? (
              <div className="text-sm text-muted-foreground">
                <p>The page will automatically reload in a moment to fix this issue.</p>
                <p>If the problem persists, try clearing your browser cache.</p>
              </div>
            ) : (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {error?.toString()}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2">
              <Button onClick={this.retry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                size="sm"
                variant={isChunkError ? "default" : "outline"}
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Hook version for modern React patterns
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)
  
  const resetError = React.useCallback(() => {
    setError(null)
  }, [])
  
  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])
  
  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])
  
  return { captureError, resetError }
} 