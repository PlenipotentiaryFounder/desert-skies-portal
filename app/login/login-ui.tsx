'use client'

import React from "react"
import { LoginForm } from "@/components/auth/login-form"

export function LoginUI() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/20 to-sky-100/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(99,102,241,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(14,165,233,0.1),transparent_50%)]"></div>
      </div>
      
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