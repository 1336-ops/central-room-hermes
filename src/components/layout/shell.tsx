"use client"

import React, { useState } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { cn } from "@/lib/utils"
import { ProfileProvider } from "@/lib/profile-context"

export function Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  if (pathname === "/login") return <>{children}</>

  return (
    <ProfileProvider>
      <div className="min-h-screen bg-background">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className={cn("transition-all duration-300", collapsed ? "md:ml-16" : "md:ml-64")}>
          <Header onMobileMenuOpen={() => setMobileOpen(true)} />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ProfileProvider>
  )
}

