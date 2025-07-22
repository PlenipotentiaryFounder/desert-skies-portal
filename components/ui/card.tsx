import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "relative overflow-hidden transition-all duration-300",
  {
    variants: {
      variant: {
        default: "rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md",
        glass: "rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-glass hover:shadow-glass-dark hover:scale-[1.02]",
        glassDark: "rounded-2xl bg-black/20 backdrop-blur-md border border-white/5 shadow-glass-dark hover:bg-black/30 hover:scale-[1.02]",
        aviation: "rounded-2xl bg-gradient-to-br from-white/5 to-white/3 backdrop-blur-sm border border-aviation-sunset-200/20 shadow-sunset hover:shadow-sunset-lg hover:scale-[1.02] hover:border-aviation-sunset-300/30",
        sunset: "rounded-2xl bg-gradient-to-br from-aviation-sunset-500/10 to-aviation-sunset-600/5 backdrop-blur-sm border border-aviation-sunset-300/20 shadow-sunset hover:shadow-sunset-lg hover:scale-[1.02]",
        sky: "rounded-2xl bg-gradient-to-br from-aviation-sky-600/10 to-aviation-sky-700/5 backdrop-blur-sm border border-aviation-sky-300/20 shadow-sky hover:shadow-sky-lg hover:scale-[1.02]",
        elevated: "rounded-2xl bg-white/10 shadow-xl hover:shadow-2xl hover:scale-[1.02] border-0 backdrop-blur-md",
        bordered: "rounded-2xl border-2 border-aviation-sunset-200/30 bg-white/5 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-aviation-sunset-300/50",
        gradient: "rounded-2xl bg-gradient-to-br from-aviation-sunset-500/10 to-aviation-sky-600/10 border border-aviation-sunset-200/20 shadow-md hover:shadow-lg",
        animated: "rounded-2xl bg-gradient-to-br from-white/5 to-white/3 backdrop-blur-sm border border-aviation-sunset-200/20 shadow-sunset hover:shadow-sunset-lg hover:scale-[1.02] animate-float",
        night: "rounded-2xl bg-gradient-to-br from-aviation-night-800/20 to-aviation-night-900/10 backdrop-blur-sm border border-aviation-night-600/20 shadow-night hover:shadow-night-lg hover:scale-[1.02]",
        dashboard: "rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-glass hover:shadow-glass-dark hover:scale-[1.02]",
        metric: "rounded-2xl bg-gradient-to-br from-aviation-sunset-500/10 to-aviation-sky-600/10 backdrop-blur-sm border border-aviation-sunset-200/20 shadow-sunset hover:shadow-sunset-lg hover:scale-[1.02]",
        status: "rounded-2xl bg-white/5 backdrop-blur-md border-l-4 border-aviation-sunset-500 shadow-glass hover:shadow-glass-dark hover:scale-[1.02]",
        alert: "rounded-2xl bg-gradient-to-br from-aviation-danger-500/10 to-aviation-sunset-500/5 backdrop-blur-sm border-l-4 border-aviation-danger-500 shadow-glass hover:shadow-glass-dark hover:scale-[1.02]",
        success: "rounded-2xl bg-gradient-to-br from-aviation-success-500/10 to-aviation-sunset-500/5 backdrop-blur-sm border-l-4 border-aviation-success-500 shadow-glass hover:shadow-glass-dark hover:scale-[1.02]",
      },
      size: {
        default: "",
        sm: "p-4",
        lg: "p-8",
        xl: "p-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  hover?: boolean
  glow?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover = true, glow = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, size, className }),
        hover && "hover-lift",
        glow && "glow"
      )}
      {...props}
    >
      {/* Gradient Border Effect */}
      {variant === "aviation" && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-aviation-sunset-500/20 via-aviation-sky-600/20 to-aviation-sunset-600/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}
      
      {/* Shimmer Effect */}
      {variant === "animated" && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-none tracking-tight text-aviation-sunset-300",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
