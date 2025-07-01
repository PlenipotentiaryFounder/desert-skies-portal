import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = ["/student", "/instructor", "/admin"]

// Routes that should redirect to dashboard if user is already authenticated
const authRoutes = ["/login", "/signup"]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  console.log(`--- Middleware Run ---`);
  console.log(`Path: ${path}`);
  console.log(`User object is ${user ? 'present' : 'null'}`);
  if (user) {
    console.log(`User ID: ${user.id}`);
  }
  console.log(`----------------------`);

  // Skip middleware for static assets and API routes
  if (path.startsWith("/_next") || path.startsWith("/api/") || path.includes(".") || path.startsWith("/public/")) {
    return response
  }

  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => path === route)

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectedFrom', path)
    console.log(`Redirecting unauthenticated user from protected route "${path}" to login.`);
    return NextResponse.redirect(redirectUrl)
  }
  
  if (user && (isAuthRoute || path === '/')) {
     try {
        console.log("--- User Authentication Success: Starting Dashboard Redirect Logic ---");
        const { data: userRoles, error: rolesError } = await supabase.rpc('get_user_roles_for_middleware', { 
          p_user_id: user.id 
        })

        if (rolesError) {
          console.error("Error fetching user roles:", rolesError);
          return response; // Exit gracefully, allowing navigation
        }

        const roles = userRoles as { role_name: string }[] || []
        const hasAdmin = roles.some(r => r.role_name === 'admin')
        const hasInstructor = roles.some(r => r.role_name === 'instructor')
        const hasStudent = roles.some(r => r.role_name === 'student')
        
        console.log("User Roles:", roles.map(r => r.role_name));

        let redirectUrl = "";
        // Default admin/instructors to instructor dashboard
        if (hasAdmin && hasInstructor) redirectUrl = "/instructor/dashboard";
        else if (hasAdmin) redirectUrl = "/admin/dashboard";
        else if (hasInstructor) redirectUrl = "/instructor/dashboard";
        else if (hasStudent) redirectUrl = "/student/dashboard";

        if (redirectUrl && path !== redirectUrl) {
          console.log(`Redirecting authenticated user from "${path}" to: ${redirectUrl}`);
          return NextResponse.redirect(new URL(redirectUrl, request.url))
        } else {
           console.warn(`Authenticated user with roles (${roles.map(r=>r.role_name).join(', ')}) on auth route but no redirect rule matched.`);
        }
      } catch (error) {
        console.error("Error during dashboard redirect logic:", error)
        // allow request to continue
      }
  }

  if (user && isProtectedRoute) {
     try {
        const { data: userRoles, error: rolesError } = await supabase.rpc('get_user_roles_for_middleware', { 
          p_user_id: user.id 
        })
        
        if (rolesError) {
          console.error("Error fetching user roles for route protection:", rolesError);
          return response;
        }

        const roles = userRoles as { role_name: string }[] || []
        const hasAdmin = roles.some(r => r.role_name === 'admin')
        const hasInstructor = roles.some(r => r.role_name === 'instructor')
        const hasStudent = roles.some(r => r.role_name === 'student')

        if (path.startsWith("/admin") && !hasAdmin) {
            console.log(`User without admin role attempting to access ${path}. Redirecting.`);
            // Redirect non-admins from /admin
            if(hasInstructor) return NextResponse.redirect(new URL('/instructor/dashboard', request.url));
            if(hasStudent) return NextResponse.redirect(new URL('/student/dashboard', request.url));
        }

        if (path.startsWith("/instructor") && !hasInstructor) {
           console.log(`User without instructor role attempting to access ${path}. Redirecting.`);
           // Redirect non-instructors from /instructor
           if(hasAdmin) return NextResponse.redirect(new URL('/admin/dashboard', request.url));
           if(hasStudent) return NextResponse.redirect(new URL('/student/dashboard', request.url));
        }

        if (path.startsWith("/student") && !hasStudent) {
            console.log(`User without student role attempting to access ${path}. Redirecting.`);
            // Redirect non-students from /student
            if(hasAdmin) return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            if(hasInstructor) return NextResponse.redirect(new URL('/instructor/dashboard', request.url));
        }

      } catch (error) {
        console.error("Error during role-specific route access check:", error)
      }
  }

  return response
}

// Configure the middleware to run only on the routes we care about
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
