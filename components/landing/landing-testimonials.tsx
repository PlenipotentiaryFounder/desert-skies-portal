export function LandingTestimonials() {
  return (
    <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Testimonials</div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Trusted by Flight Schools Nationwide
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Hear what our users have to say about their experience with Desert Skies Aviation.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Sarah Johnson</h3>
                  <p className="text-sm text-muted-foreground">Chief Flight Instructor, SkyHigh Aviation</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "Desert Skies has transformed how we manage our flight school. The syllabus tracking and student
                progress features have made our Part 141 compliance so much easier."
              </p>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Michael Rodriguez</h3>
                  <p className="text-sm text-muted-foreground">Student Pilot</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "As a student, I love being able to track my progress and see exactly what I need to work on. The
                scoring system helps me understand my strengths and weaknesses."
              </p>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">David Chen</h3>
                  <p className="text-sm text-muted-foreground">Independent CFI</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "The scheduling and document management features have made my life as an independent instructor so much
                easier. I can focus on teaching instead of paperwork."
              </p>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Jennifer Williams</h3>
                  <p className="text-sm text-muted-foreground">Flight School Owner</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "Desert Skies has helped us scale our flight school operations while maintaining quality. The analytics
                and reporting tools give us valuable insights into our business."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
