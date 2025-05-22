import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/types/supabase"

// Define protected routes that require authentication
const protectedRoutes = ["/student", "/instructor", "/admin"]

// Routes that should redirect to dashboard if user is already authenticated
const authRoutes = ["/login", "/signup", "/"]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const path = req.nextUrl.pathname

  // Skip middleware for static assets and API routes
  if (path.startsWith("/_next") || path.startsWith("/api/") || path.includes(".") || path.startsWith("/public/")) {
    return res
  }

  try {
    // Create a Supabase client specifically for middleware
    const supabase = createMiddlewareClient<Database>({ req, res })

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check if the current path is a protected route
    const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))
    const isAuthRoute = authRoutes.some((route) => path === route)

    // If accessing protected route without session, redirect to login
    if (isProtectedRoute && !session) {
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set("redirectedFrom", path)
      return NextResponse.redirect(redirectUrl)
    }

    // If already authenticated and trying to access auth routes, redirect to appropriate dashboard
    if (isAuthRoute && session) {
      try {
        // Get user role from profiles table
        const { data: profileData } = await supabase.from("profiles").select("role, metadata").eq("id", session.user.id).single()
        const role = profileData?.role
        const additionalRoles = profileData?.metadata?.additional_roles || []
        const hasAdmin = role === "admin" || additionalRoles.includes("admin")
        const hasInstructor = role === "instructor" || additionalRoles.includes("instructor")
        const hasStudent = role === "student" || additionalRoles.includes("student")

        // On login/root, if user has both admin and instructor, show dashboard picker
        if (hasAdmin && hasInstructor) {
          return NextResponse.redirect(new URL("/dashboard-picker", req.url))
        } else if (hasAdmin) {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url))
        } else if (hasInstructor) {
          return NextResponse.redirect(new URL("/instructor/dashboard", req.url))
        } else if (hasStudent) {
          return NextResponse.redirect(new URL("/student/dashboard", req.url))
        }
      } catch (error) {
        console.error("Error getting user role:", error)
        // Continue with the request if there's an error
        return res
      }
    }

    // Handle role-specific route access
    if (session && isProtectedRoute) {
      try {
        // Get user role
        const { data: profileData } = await supabase.from("profiles").select("role, metadata").eq("id", session.user.id).single()
        const role = profileData?.role
        const additionalRoles = profileData?.metadata?.additional_roles || []
        const hasAdmin = role === "admin" || additionalRoles.includes("admin")
        const hasInstructor = role === "instructor" || additionalRoles.includes("instructor")
        const hasStudent = role === "student" || additionalRoles.includes("student")

        // Allow admin to access any protected route, including /student/* and /instructor/*
        if (hasAdmin) {
          return res
        }

        // Check if user has access to this route based on their role or additional_roles
        if (path.startsWith("/student") && hasStudent) {
          return res
        }
        if (path.startsWith("/instructor") && hasInstructor) {
          return res
        }
        if (path.startsWith("/admin") && hasAdmin) {
          return res
        }

        // If user does not have access, redirect to their dashboard
        if (hasStudent) {
          return NextResponse.redirect(new URL("/student/dashboard", req.url))
        } else if (hasInstructor) {
          return NextResponse.redirect(new URL("/instructor/dashboard", req.url))
        } else if (hasAdmin) {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url))
        }
      } catch (error) {
        console.error("Error checking role access:", error)
        // Continue with the request if there's an error
        return res
      }
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    return res
  }
}

// Configure the middleware to run only on the routes we care about
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public files (like robots.txt, sitemap.xml, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
