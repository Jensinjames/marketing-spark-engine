
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusIndicatorVariants = cva(
  "inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        success: "bg-success-light text-success border border-success/20",
        warning: "bg-warning-light text-warning border border-warning/20",
        error: "bg-error-light text-error border border-error/20",
        info: "bg-info-light text-info border border-info/20",
        neutral: "bg-muted text-muted-foreground border border-border",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  }
)

const statusDotVariants = cva(
  "inline-block rounded-full",
  {
    variants: {
      variant: {
        success: "bg-success",
        warning: "bg-warning",
        error: "bg-error",
        info: "bg-info",
        neutral: "bg-muted-foreground",
      },
      size: {
        sm: "w-1.5 h-1.5",
        md: "w-2 h-2",
        lg: "w-2.5 h-2.5",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  }
)

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  showDot?: boolean
  dotSize?: VariantProps<typeof statusDotVariants>['size']
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, variant, size, showDot = true, dotSize, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statusIndicatorVariants({ variant, size }), className)}
        role="status"
        aria-live="polite"
        {...props}
      >
        {showDot && (
          <span 
            className={cn(statusDotVariants({ variant, size: dotSize || size }))}
            aria-hidden="true"
          />
        )}
        {children}
      </div>
    )
  }
)
StatusIndicator.displayName = "StatusIndicator"

export { StatusIndicator, statusIndicatorVariants, statusDotVariants }
