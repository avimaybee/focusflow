"use client";
import { cn } from "@/lib/utils";
import React from "react";

interface RainbowBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  isActive: boolean;
}

const RainbowBorder = React.forwardRef<HTMLDivElement, RainbowBorderProps>(
  ({ className, isActive, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        {children}
        <div
          className={cn(
            "absolute bottom-0 left-0 w-full h-[2px] transition-opacity duration-300",
            "bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-2)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-5)))]",
            "bg-[length:200%_100%]",
            isActive ? "animate-rainbow opacity-100" : "opacity-0"
          )}
        />
      </div>
    );
  }
);

RainbowBorder.displayName = "RainbowBorder";

export { RainbowBorder };