import { Button } from "@/components/ui/button"

export function LandingCTA() {
  return (
    <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Ready to Transform Your Flight Training?
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Join thousands of flight schools, instructors, and students who are elevating their training experience.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Button size="lg" asChild>
              <a href="/signup">Get Started</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/contact">Contact Sales</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
