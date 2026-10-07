"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal";
  maxHeight?: string | number;
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = "vertical", maxHeight, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative overflow-auto",
        orientation === "vertical" && "overflow-y-auto",
        orientation === "horizontal" && "overflow-x-auto",
        className
      )}
      style={{
        maxHeight: maxHeight ?? (orientation === "vertical" ? "100%" : undefined),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
);
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
