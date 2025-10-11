import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-xl border bg-background px-4 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-input bg-background hover:border-aviation-sunset-300 focus:border-aviation-sunset-500 focus:ring-aviation-sunset-500/20",
        aviation: "border-2 border-aviation-sunset-200/30 bg-white/5 backdrop-blur-sm text-aviation-sunset-100 placeholder:text-aviation-sunset-400 hover:border-aviation-sunset-300/50 focus:border-aviation-sunset-500 focus:bg-white/10 focus:ring-aviation-sunset-500/20 shadow-sm hover:shadow-md",
        glass: "border border-white/20 bg-white/5 backdrop-blur-md text-aviation-sunset-100 placeholder:text-aviation-sunset-300 hover:bg-white/10 focus:bg-white/15 focus:border-white/40 focus:ring-aviation-sunset-500/20",
        glassDark: "border border-white/10 bg-black/20 backdrop-blur-md text-aviation-sunset-100 placeholder:text-aviation-sunset-300 hover:bg-black/30 focus:bg-black/40 focus:border-white/20 focus:ring-aviation-sunset-500/20",
        outlined: "border-2 border-aviation-sunset-200/30 bg-transparent text-aviation-sunset-100 placeholder:text-aviation-sunset-400 hover:border-aviation-sunset-300/50 focus:border-aviation-sunset-500 focus:ring-aviation-sunset-500/20",
        filled: "border-0 bg-aviation-sunset-500/10 text-aviation-sunset-100 placeholder:text-aviation-sunset-400 hover:bg-aviation-sunset-500/15 focus:bg-white/10 focus:ring-2 focus:ring-aviation-sunset-500/20",
        sunset: "border-2 border-aviation-sunset-300/30 bg-aviation-sunset-500/5 backdrop-blur-sm text-aviation-sunset-100 placeholder:text-aviation-sunset-400 hover:border-aviation-sunset-400/50 focus:border-aviation-sunset-500 focus:bg-aviation-sunset-500/10 focus:ring-aviation-sunset-500/20",
        sky: "border-2 border-aviation-sky-300/30 bg-aviation-sky-600/5 backdrop-blur-sm text-aviation-sky-100 placeholder:text-aviation-sky-400 hover:border-aviation-sky-400/50 focus:border-aviation-sky-500 focus:bg-aviation-sky-600/10 focus:ring-aviation-sky-500/20",
      },
      size: {
        default: "h-11 px-4 py-3",
        sm: "h-9 px-3 py-2 text-xs",
        lg: "h-12 px-6 py-4 text-base",
        xl: "h-14 px-8 py-5 text-lg",
      },
      state: {
        default: "",
        error: "border-aviation-danger-500 focus:border-aviation-danger-500 focus:ring-aviation-danger-500/20",
        success: "border-aviation-success-500 focus:border-aviation-success-500 focus:ring-aviation-success-500/20",
        warning: "border-aviation-warning-500 focus:border-aviation-warning-500 focus:ring-aviation-warning-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  loading?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size, 
    state,
    icon,
    iconPosition = "left",
    loading = false,
    type,
    ...props 
  }, ref) => {
    return (
      <div className="relative">
        {/* Left Icon */}
        {icon && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-aviation-sunset-400 pointer-events-none">
            {icon}
          </div>
        )}
        
        {/* Right Icon or Loading Spinner */}
        {(icon && iconPosition === "right") || loading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-aviation-sunset-400 pointer-events-none">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-aviation-sunset-500 border-t-transparent" />
            ) : (
              icon
            )}
          </div>
        ) : null}
        
        <input
          type={type}
          className={cn(
            inputVariants({ variant, size, state, className }),
            icon && iconPosition === "left" && "pl-10",
            (icon && iconPosition === "right") || loading ? "pr-10" : "",
            "focus-ring"
          )}
          ref={ref}
          suppressHydrationWarning={true}
          {...props}
        />
        
        {/* Focus Ring Effect */}
        <div className="absolute inset-0 rounded-xl ring-2 ring-transparent transition-all duration-300 pointer-events-none peer-focus:ring-aviation-sunset-500/20" />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
