"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Lock, Eye, EyeOff, Plane, Shield, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md mx-auto"
    >
      <Card variant="glass" className="shadow-2xl border-0">
        <CardHeader className="space-y-1 pb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center mb-4"
          >
            <div className="p-3 rounded-full bg-gradient-to-r from-aviation-sunset-500 to-aviation-sunset-600 shadow-sunset">
              <Plane className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          
          <CardTitle className="text-2xl font-bold text-center text-foreground font-display">
            Welcome to Desert Skies
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Sign in to your aviation training portal
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                variant="aviation"
                placeholder="pilot@example.com"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                {...register('email')}
                icon={<Mail className="w-4 h-4" />}
                iconPosition="left"
                className="h-12"
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-aviation-danger-400"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                variant="aviation"
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register('password')}
                icon={<Lock className="w-4 h-4" />}
                iconPosition="left"
                className="h-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="iconSm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-aviation-danger-400"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive">
                  <Shield className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <Button
              type="submit"
              variant="aviation"
              size="lg"
              loading={isLoading}
              className="w-full h-12 text-lg font-semibold"
              icon={<Zap className="w-5 h-5" />}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.a
              href="/signup"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-foreground bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300"
            >
              <Plane className="w-4 h-4" />
              Sign Up
            </motion.a>
            
            <motion.a
              href="/forgot-password"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-foreground bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300"
            >
              <Shield className="w-4 h-4" />
              Forgot Password
            </motion.a>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our{' '}
              <motion.a
                href="/legal/terms"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-aviation-sunset-400 hover:text-aviation-sunset-300 transition-colors"
              >
                Terms of Service
              </motion.a>{' '}
              and{' '}
              <motion.a
                href="/legal/privacy-policy"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-aviation-sunset-400 hover:text-aviation-sunset-300 transition-colors"
              >
                Privacy Policy
              </motion.a>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
