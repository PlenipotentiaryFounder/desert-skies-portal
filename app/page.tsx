import { redirect } from "next/navigation"
import { createServerSupabaseClient, getUserFromSession } from "@/lib/supabase/server"

export default async function Home() {
  try {
    // Get the current user
    const user = await getUserFromSession()

    if (user) {
      // User is authenticated, get their role
      const supabase = await createServerSupabaseClient()
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      // Redirect based on role
      if (profile?.role === "admin") {
        redirect("/admin/dashboard")
      } else if (profile?.role === "instructor") {
        redirect("/instructor/dashboard")
      } else if (profile?.role === "student") {
        redirect("/student/dashboard")
      }
    }

    // If not authenticated or no role found, show a simple landing page
    return (
      <div className="flex flex-col min-h-screen">
        <header className="border-b">
          <div className="container flex h-16 items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M12 19l9 2-9-18-9 18 9-2z" />
              </svg>
              <span className="text-xl font-bold">Desert Skies Aviation</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/login" className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent">
                Log In
              </a>
              <a
                href="/signup"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Sign Up
              </a>
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">Modern Flight Training Management</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Streamline your aviation training with our comprehensive platform for students, instructors, and flight
              schools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="px-6 py-3 text-base font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Get Started
              </a>
              <a href="/login" className="px-6 py-3 text-base font-medium border rounded-md hover:bg-accent">
                Log In
              </a>
            </div>
          </div>
        </main>
        <footer className="border-t py-6">
          <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Desert Skies Aviation. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    )
  } catch (error) {
    console.error("Error in Home page:", error)

    // Fallback UI in case of error
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Desert Skies Aviation</h1>
        <p className="mb-6">Welcome to our flight training portal</p>
        <div className="flex gap-4">
          <a href="/login" className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent">
            Log In
          </a>
          <a
            href="/signup"
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Sign Up
          </a>
        </div>
      </div>
    )
  }
}
