"use client"

import { useEffect } from "react"

export function ChunkErrorHandler() {
  useEffect(() => {
    // Global error handler for chunk loading errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error
      if (error?.name === "ChunkLoadError" || event.message?.includes("Loading chunk")) {
        console.warn("ChunkLoadError detected, reloading page...")
        // Small delay to prevent infinite reload loops
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    }

    // Handle unhandled promise rejections (like failed dynamic imports)
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      if (reason?.name === "ChunkLoadError" || reason?.message?.includes("Loading chunk")) {
        console.warn("ChunkLoadError in promise rejection, reloading page...")
        event.preventDefault() // Prevent default browser behavior
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    }

    // Webpack error handler for chunk loading
    const handleWebpackError = (event: any) => {
      if (event.detail?.error?.name === "ChunkLoadError") {
        console.warn("Webpack ChunkLoadError detected, reloading page...")
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    }

    // Add event listeners
    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleRejection)
    
    // Custom webpack error event
    window.addEventListener("webpackChunkError", handleWebpackError)

    // Service worker update handler
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("Service worker updated, reloading page...")
        window.location.reload()
      })
    }

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleRejection)
      window.removeEventListener("webpackChunkError", handleWebpackError)
    }
  }, [])

  return null
} 