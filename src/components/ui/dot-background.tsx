"use client";
import { cn } from "@/lib/utils";
import React from "react";

export function DotBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full bg-background relative">
      <div
        className={cn(
          "absolute inset-0 h-full w-full",
          "[background-size:20px_20px]",
          "[background-image:radial-gradient(hsl(var(--dot-background))_1px,transparent_1px)]"
        )}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
