"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { 
  Loader2, 
  User, 
  Mail, 
  Lock, 
  Plane, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Users,
  GraduationCap
} from "lucide-react"
import Link from "next/link"

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  role: z.enum(["student"]),
})

export function SignupForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "student",
    },
  })

  // Lock role to student - instructors must use invitation system
  useEffect(() => {
    form.setValue('role', 'student')
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            role: values.role,
          },
        },
      })

      if (authError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: authError.message,
        })
        return
      }

      if (authData.user) {
        // Set initial status based on role
        const status = values.role === "instructor" ? "pending" : "active"

        // Create profile using our server API route (which has admin privileges)
        const response = await fetch("/api/auth/create-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: authData.user.id,
            email: values.email,
            firstName: values.firstName,
            lastName: values.lastName,
            role: values.role,
            status: status,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          console.error("Profile creation error:", result.error)
          toast({
            variant: "destructive",
            title: "Error creating profile",
            description: result.error || "Failed to create user profile",
          })
          return
        }

        toast({
          title: "Account created successfully!",
          description:
            values.role === "instructor"
              ? "Your instructor account has been created and is pending approval by an administrator."
              : "Welcome to Desert Skies Aviation! You can now access your training portal.",
        })

        // Sign in the user immediately after signup
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        })

        if (signInError) {
          console.error("Sign in error:", signInError)
          toast({
            variant: "destructive",
            title: "Error signing in",
            description: signInError.message,
          })
          return
        }

        router.refresh()
        router.push("/")
      }
    } catch (error) {
      console.error("Signup error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header with Aviation Theme */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg">
            <Plane className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Desert Skies</h1>
        <p className="text-gray-700">
          Start your aviation journey with professional flight training
        </p>
      </div>

      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Sign up for your flight training account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">First Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-aviation-sunset-300" />
                          <Input 
                            placeholder="John" 
                            autoComplete="given-name"
                            {...field} 
                            className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Last Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-aviation-sunset-300" />
                          <Input 
                            placeholder="Doe" 
                            autoComplete="family-name"
                            {...field} 
                            className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-aviation-sunset-300" />
                        <Input 
                          placeholder="pilot@example.com" 
                          autoComplete="email"
                          {...field} 
                          className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-aviation-sunset-300" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          autoComplete="new-password"
                          {...field} 
                          className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Hidden role field - always student for public signup */}
              <input type="hidden" name="role" value="student" />
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Instructor Information */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Flight Instructors</p>
                <p className="text-xs text-blue-700 mt-1">
                  Interested in becoming an instructor? Contact your administrator for an invitation link.
                  Instructor accounts require proper certification verification.
                </p>
              </div>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-aviation-sunset-200">
              Already have an account?{" "}
              <Link 
                href="/login" 
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center">
        <div className="flex justify-center items-center gap-2 text-sm text-aviation-sunset-300">
          <Badge variant="outline" className="text-xs">
            FAA Part 141 Certified
          </Badge>
          <Badge variant="outline" className="text-xs">
            Professional Training
          </Badge>
        </div>
      </div>
    </div>
  )
}
