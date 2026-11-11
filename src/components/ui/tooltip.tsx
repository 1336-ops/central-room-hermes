import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
}

function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>
}

function Tooltip({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="group relative inline-block" {...props}>{children}</div>
}

function TooltipTrigger({ children, asChild, ...props }: React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
  return <div {...props}>{children}</div>
}

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left"
}

function TooltipContent({ className, children, side = "top", ...props }: TooltipContentProps) {
  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
  }
  return (
    <div
      className={cn(
        "invisible group-hover:visible absolute z-50 rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white shadow-md whitespace-nowrap",
        sideClasses[side],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent }
