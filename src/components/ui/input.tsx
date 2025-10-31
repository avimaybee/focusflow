
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 md:h-10 min-h-[44px] md:min-h-0 w-full rounded-lg border-2 border-input bg-card/50 backdrop-blur-sm px-3 py-2 text-base md:text-sm font-normal leading-relaxed shadow-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-foreground/50 placeholder:font-medium focus-visible:outline-none focus-visible:bg-card focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:shadow-md transition-all duration-200 hover:border-input/80 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
