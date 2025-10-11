import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-aviation-sunset-500 to-aviation-sunset-600 text-white shadow-sunset hover:shadow-sunset-lg",
        secondary:
          "border-transparent bg-gradient-to-r from-aviation-runway-100 to-aviation-runway-200 text-aviation-runway-800 hover:from-aviation-runway-200 hover:to-aviation-runway-300",
        destructive:
          "border-transparent bg-gradient-to-r from-aviation-danger-500 to-aviation-danger-600 text-white shadow-lg hover:shadow-xl",
        success:
          "border-transparent bg-gradient-to-r from-aviation-success-500 to-aviation-success-600 text-white shadow-lg hover:shadow-xl",
        warning:
          "border-transparent bg-gradient-to-r from-aviation-warning-500 to-aviation-warning-600 text-white shadow-lg hover:shadow-xl",
        aviation:
          "border-transparent bg-gradient-to-r from-aviation-sky-500 to-aviation-sky-600 text-white shadow-sky hover:shadow-sky-lg",
        sky:
          "border-transparent bg-gradient-to-r from-aviation-sky-500 to-aviation-sky-600 text-white shadow-sky hover:shadow-sky-lg",
        sunset:
          "border-transparent bg-gradient-to-r from-aviation-sunset-500 to-aviation-sunset-600 text-white shadow-sunset hover:shadow-sunset-lg",
        outline: 
          "border-2 border-aviation-sunset-200/30 text-aviation-sunset-700 hover:bg-aviation-sunset-50",
        glass:
          "border border-white/20 bg-white/10 backdrop-blur-md text-aviation-sunset-100 hover:bg-white/20",
        glassDark:
          "border border-white/10 bg-black/20 backdrop-blur-md text-aviation-sunset-100 hover:bg-black/30",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-4 py-1.5 text-sm",
        xl: "px-6 py-2 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

function Badge({ className, variant, size, icon, iconPosition = "left", children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && iconPosition === "left" && (
        <span className="mr-1">{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className="ml-1">{icon}</span>
      )}
    </div>
  )
}

export { Badge, badgeVariants }
