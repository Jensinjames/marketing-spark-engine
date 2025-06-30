
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Stack Component
const stackVariants = cva(
  "flex flex-col",
  {
    variants: {
      gap: {
        none: "gap-0",
        xs: "gap-1",
        sm: "gap-2",
        md: "gap-4",
        lg: "gap-6",
        xl: "gap-8",
        "2xl": "gap-12",
      },
      align: {
        start: "items-start",
        center: "items-center",
        end: "items-end",
        stretch: "items-stretch",
      },
      justify: {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        between: "justify-between",
        around: "justify-around",
        evenly: "justify-evenly",
      },
    },
    defaultVariants: {
      gap: "md",
      align: "stretch",
      justify: "start",
    },
  }
)

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {
  as?: React.ElementType
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, gap, align, justify, as: Component = "div", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(stackVariants({ gap, align, justify }), className)}
        {...props}
      />
    )
  }
)
Stack.displayName = "Stack"

// Inline Stack Component
const inlineStackVariants = cva(
  "flex flex-row items-center",
  {
    variants: {
      gap: {
        none: "gap-0",
        xs: "gap-1",
        sm: "gap-2",
        md: "gap-4",
        lg: "gap-6",
        xl: "gap-8",
        "2xl": "gap-12",
      },
      align: {
        start: "items-start",
        center: "items-center",
        end: "items-end",
        baseline: "items-baseline",
        stretch: "items-stretch",
      },
      justify: {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        between: "justify-between",
        around: "justify-around",
        evenly: "justify-evenly",
      },
      wrap: {
        wrap: "flex-wrap",
        nowrap: "flex-nowrap",
        reverse: "flex-wrap-reverse",
      },
    },
    defaultVariants: {
      gap: "md",
      align: "center",
      justify: "start",
      wrap: "nowrap",
    },
  }
)

export interface InlineStackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof inlineStackVariants> {
  as?: React.ElementType
}

const InlineStack = React.forwardRef<HTMLDivElement, InlineStackProps>(
  ({ className, gap, align, justify, wrap, as: Component = "div", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(inlineStackVariants({ gap, align, justify, wrap }), className)}
        {...props}
      />
    )
  }
)
InlineStack.displayName = "InlineStack"

// Container Component
const containerVariants = cva(
  "mx-auto px-4",
  {
    variants: {
      size: {
        sm: "max-w-2xl",
        md: "max-w-4xl",
        lg: "max-w-6xl",
        xl: "max-w-7xl",
        full: "max-w-full",
        screen: "max-w-screen-2xl",
      },
      padding: {
        none: "px-0",
        sm: "px-4",
        md: "px-6",
        lg: "px-8",
        xl: "px-12",
      },
    },
    defaultVariants: {
      size: "lg",
      padding: "md",
    },
  }
)

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: React.ElementType
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, as: Component = "div", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(containerVariants({ size, padding }), className)}
        {...props}
      />
    )
  }
)
Container.displayName = "Container"

// Surface Component
const surfaceVariants = cva(
  "bg-card border border-border rounded-lg",
  {
    variants: {
      variant: {
        flat: "bg-card",
        elevated: "bg-surface-elevated shadow-sm",
        "elevated-2": "bg-surface-elevated-2 shadow-md",
        outlined: "bg-transparent border-2",
        filled: "bg-muted/50",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-12",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "flat",
      padding: "md",
      radius: "lg",
    },
  }
)

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {
  as?: React.ElementType
}

const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, variant, padding, radius, as: Component = "div", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(surfaceVariants({ variant, padding, radius }), className)}
        {...props}
      />
    )
  }
)
Surface.displayName = "Surface"

export { Stack, InlineStack, Container, Surface, stackVariants, inlineStackVariants, containerVariants, surfaceVariants }
