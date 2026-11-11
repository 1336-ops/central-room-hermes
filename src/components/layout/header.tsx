"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SidebarTrigger } from "./sidebar"
import { ModelSelector } from "@/components/dashboard/model-selector"
import { useProfile } from "@/lib/profile-context"

interface HeaderProps {
  onMobileMenuOpen: () => void
}

const PROFILE_COLORS: Record<string, string> = {
  coding: "from-emerald-400 to-cyan-500",
  law: "from-violet-400 to-purple-500",
  research: "from-amber-400 to-orange-500",
  social: "from-pink-400 to-rose-500",
}

export function Header({ onMobileMenuOpen }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false)
  const { profile } = useProfile()

  const handleLogout = async () => {
    try { await fetch("/dashboard/api/auth", { method: "DELETE" }) } catch {}
    window.location.href = "/dashboard/login"
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-800 bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <SidebarTrigger onClick={onMobileMenuOpen} />

      <div className="flex-1">
        <h1 className={`text-lg font-semibold bg-gradient-to-r ${PROFILE_COLORS[profile]} bg-clip-text text-transparent`}>
          Hermes Dashboard
        </h1>
        <p className="text-xs text-slate-500 hidden sm:block capitalize">AI Command Center • {profile}</p>
      </div>

      <div className="hidden sm:block">
        <ModelSelector />
      </div>

      <div className="relative">
        <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2">
          <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-emerald-500/30 transition-all">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">AZ</AvatarFallback>
          </Avatar>
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-12 z-50 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
              <div className="p-3 border-b border-slate-800">
                <p className="text-sm font-medium text-white">Tuan Zack</p>
                <p className="text-xs text-slate-400 capitalize">{profile} profile</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

