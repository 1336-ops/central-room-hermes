"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, FileText, Monitor, MessageSquare, Zap,
  ScrollText, Calendar, Box, Settings, ChevronLeft, ChevronRight,
  Menu, X, FolderOpen, Activity, User, Brain,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProfile } from "@/lib/profile-context"

const navItems = [
  { label: "Dashboard",    href: "/",             icon: LayoutDashboard },
  { label: "Hermes Agent", href: "/hermes",        icon: Brain },
  { label: "Agent Chat",   href: "/chat",          icon: MessageSquare },
  { label: "Briefing",     href: "/briefing",      icon: FileText },
  { label: "System",       href: "/system",        icon: Monitor },
  { label: "Sessions",     href: "/sessions",      icon: Calendar },
  { label: "Files",        href: "/files",         icon: FolderOpen },
  { label: "Skills",       href: "/skills",        icon: Zap },
  { label: "Models",       href: "/models",        icon: Box },
  { label: "Model Health", href: "/model-status",  icon: Activity },
  { label: "Logs",         href: "/logs",          icon: ScrollText },
  { label: "Perkara",      href: "/perkara",       icon: FileText },
  { label: "Knowledge Graph", href: "/knowledge-graph", icon: Brain },
  { label: "Schedule",     href: "/schedule",      icon: Calendar },
  { label: "Finance",      href: "/finance",       icon: Zap },
  { label: "Profile",      href: "/profile",       icon: User },
  { label: "Settings",     href: "/settings",      icon: Settings },
]

const PROFILES = ["coding", "law", "research", "social"] as const
const PROFILE_COLORS: Record<string, string> = {
  coding:   "from-emerald-400 to-cyan-500",
  law:      "from-violet-400 to-purple-500",
  research: "from-amber-400 to-orange-500",
  social:   "from-pink-400 to-rose-500",
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function SidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" onClick={onClick} className="md:hidden text-slate-400 hover:text-white">
      <Menu className="h-5 w-5" />
    </Button>
  )
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { profile, setProfile } = useProfile()

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-lg", PROFILE_COLORS[profile])}>
              H
            </div>
            <div>
              <span className="font-semibold text-white text-sm">Hermes</span>
              <p className="text-xs text-slate-500 capitalize">{profile}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost" size="icon" onClick={onToggle}
          className="text-slate-400 hover:text-white hover:bg-sidebar-accent hidden md:flex"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost" size="icon" onClick={onMobileClose}
          className="text-slate-400 hover:text-white md:hidden"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Profile switcher */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <p className="text-xs text-slate-500 mb-2 px-1">Profile</p>
          <div className="grid grid-cols-2 gap-1">
            {PROFILES.map(p => (
              <button
                key={p}
                onClick={() => setProfile(p)}
                className={cn(
                  "text-xs px-2 py-1.5 rounded-lg capitalize transition-all",
                  profile === p
                    ? "bg-slate-700 text-white font-medium"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                isActive
                  ? "bg-sidebar-accent text-white font-medium"
                  : "text-slate-400 hover:text-white hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        {!collapsed && (
          <p className="text-xs text-slate-600 text-center">Hermes Dashboard v0.2.0</p>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 hidden md:flex flex-col border-r border-slate-800 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={onMobileClose} />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-slate-800 md:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
