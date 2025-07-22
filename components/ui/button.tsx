import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-aviation-sunset-500 to-aviation-sunset-600 text-white shadow-sunset hover:shadow-sunset-lg hover:scale-105 active:scale-95",
        destructive: "bg-gradient-to-r from-aviation-danger-500 to-aviation-danger-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
        outline: "border-2 border-aviation-sunset-200 bg-white/5 backdrop-blur-sm text-aviation-sunset-300 hover:bg-aviation-sunset-50/10 hover:border-aviation-sunset-300 hover:scale-105 active:scale-95",
        secondary: "bg-gradient-to-r from-aviation-runway-100 to-aviation-runway-200 text-aviation-runway-800 border border-aviation-runway-200 hover:from-aviation-runway-200 hover:to-aviation-runway-300 hover:scale-105 active:scale-95",
        ghost: "hover:bg-aviation-sunset-50/10 hover:text-aviation-sunset-300 hover:scale-105 active:scale-95",
        link: "text-aviation-sunset-400 underline-offset-4 hover:underline hover:text-aviation-sunset-300",
        aviation: "bg-gradient-to-r from-aviation-sunset-500 via-aviation-sunset-600 to-aviation-sunset-700 text-white shadow-sunset hover:shadow-sunset-lg hover:scale-105 active:scale-95 animate-sunset-glow",
        sunset: "bg-gradient-to-r from-aviation-sunset-500 to-aviation-sunset-600 text-white shadow-sunset hover:shadow-sunset-lg hover:scale-105 active:scale-95",
        sky: "bg-gradient-to-r from-aviation-sky-600 to-aviation-sky-700 text-white shadow-sky hover:shadow-sky-lg hover:scale-105 active:scale-95",
        success: "bg-gradient-to-r from-aviation-success-500 to-aviation-success-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
        warning: "bg-gradient-to-r from-aviation-warning-500 to-aviation-warning-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
        danger: "bg-gradient-to-r from-aviation-danger-500 to-aviation-danger-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-glass hover:bg-white/20 hover:shadow-glass-dark hover:scale-105 active:scale-95",
        glassDark: "bg-black/20 backdrop-blur-md border border-white/10 text-white shadow-glass-dark hover:bg-black/30 hover:scale-105 active:scale-95",
        animated: "bg-gradient-animated text-white shadow-sunset hover:shadow-sunset-lg hover:scale-105 active:scale-95 animate-pulse-soft",
        night: "bg-gradient-to-r from-aviation-night-800 to-aviation-night-900 text-white shadow-night hover:shadow-night-lg hover:scale-105 active:scale-95",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-lg px-4 py-2 text-xs",
        lg: "h-12 rounded-xl px-8 py-4 text-base",
        xl: "h-14 rounded-xl px-10 py-5 text-lg",
        icon: "h-11 w-11 rounded-xl",
        iconSm: "h-9 w-9 rounded-lg",
        iconLg: "h-12 w-12 rounded-xl",
      },
      loading: {
        true: "cursor-wait",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading = false,
    loadingText,
    icon,
    iconPosition = "left",
    children,
    asChild = false,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // When asChild is true, we need to pass the className and props to the child
    // but not render any additional wrapper elements
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, loading, className }))}
          ref={ref}
          disabled={disabled || loading}
          suppressHydrationWarning={true}
          {...props}
        >
          {children}
        </Comp>
      )
    }
    
    // Regular button rendering with all the effects
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        suppressHydrationWarning={true}
        {...props}
      >
        {/* Shimmer Effect */}
        <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          </div>
        )}
        
        {/* Content */}
        <span className={cn(
          "relative flex items-center gap-2",
          loading && "opacity-0"
        )}>
          {icon && iconPosition === "left" && !loading && (
            <span className="transition-transform group-hover:scale-110">
              {icon}
            </span>
          )}
          
          {loading && loadingText ? loadingText : children}
          
          {icon && iconPosition === "right" && !loading && (
            <span className="transition-transform group-hover:scale-110">
              {icon}
            </span>
          )}
        </span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
