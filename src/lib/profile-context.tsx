"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export type Profile = "coding" | "law" | "research" | "social"

interface ProfileContextType {
  profile: Profile
  setProfile: (p: Profile) => void
}

const ProfileContext = createContext<ProfileContextType>({
  profile: "coding",
  setProfile: () => {},
})

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<Profile>("coding")

  useEffect(() => {
    const saved = localStorage.getItem("hermes-profile") as Profile
    if (saved) setProfileState(saved)
  }, [])

  const setProfile = (p: Profile) => {
    setProfileState(p)
    localStorage.setItem("hermes-profile", p)
    // Persist to settings API
    fetch("/dashboard/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeProfile: p }),
    }).catch(() => {})
  }

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}

