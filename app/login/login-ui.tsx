'use client'

import React from "react"
import { LoginForm } from "@/components/auth/login-form"

export function LoginUI() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23e0e7ff" fill-opacity="0.3"%3E%3Cpath d="M30 30c0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12 12-5.373 12-12zm12 0c0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12 12-5.373 12-12z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      
      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            © 2025 Desert Skies Aviation Training. All rights reserved.
          </p>
          <div className="mt-2 flex justify-center gap-6 text-xs text-gray-400">
            <a href="/legal/privacy-policy" className="hover:text-gray-600 transition-colors">
              Privacy Policy
            </a>
            <a href="/legal/terms" className="hover:text-gray-600 transition-colors">
              Terms & Conditions
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 