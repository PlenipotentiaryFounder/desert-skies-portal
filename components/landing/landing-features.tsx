import { BookOpen, Calendar, ClipboardCheck, FileText, Gauge, Users } from "lucide-react"

export function LandingFeatures() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Features</div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Everything You Need for Flight Training
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Our platform streamlines the entire flight training process with powerful tools for students, instructors,
              and administrators.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">Dynamic Syllabi</h3>
            </div>
            <p className="text-muted-foreground">
              Comprehensive, FAA-aligned training syllabi with progress tracking and performance metrics.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">Scheduling</h3>
            </div>
            <p className="text-muted-foreground">
              Effortless flight session scheduling with aircraft availability and instructor coordination.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">Performance Tracking</h3>
            </div>
            <p className="text-muted-foreground">
              Real-time performance metrics and scoring for maneuvers and flight sessions.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">Document Management</h3>
            </div>
            <p className="text-muted-foreground">
              Secure storage for licenses, medical certificates, and training records.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">FAA Requirements</h3>
            </div>
            <p className="text-muted-foreground">
              Automatic tracking of FAA requirements for different certificates and ratings.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">Role-Based Access</h3>
            </div>
            <p className="text-muted-foreground">Tailored experiences for students, instructors, and administrators.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
