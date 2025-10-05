"use client"

import type React from "react"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { hashText } from "@/lib/crypto"
import type { User, UserRole } from "@/lib/types"

type AuthContextValue = {
  user: User | null
  login: (email: string, password: string, role: UserRole) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem("pharma.user")
    if (raw) setUser(JSON.parse(raw))
    // Ensure demo users exist
    seedDemoUsers()
  }, [])

  function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
  }

  async function upgradeLegacyUsersIfNeeded(users: User[]) {
    let changed = false
    const upgraded: User[] = []
    for (const u of users as any[]) {
      const v: any = { ...u }
      // normalize email casing/whitespace
      const normEmail = normalizeEmail(v.email || "")
      if (normEmail !== v.email) {
        v.email = normEmail
        changed = true
      }
      // map any legacy role labels
      if (v.role === "Shop Owner") {
        v.role = "owner"
        changed = true
      }
      // upgrade legacy password field -> passwordHash
      if (!v.passwordHash && v.password) {
        v.passwordHash = await hashText(String(v.password))
        delete v.password
        changed = true
      }
      // ensure expected shape
      upgraded.push(v as User)
    }
    if (changed) {
      localStorage.setItem("pharma.users", JSON.stringify(upgraded))
    }
    return upgraded
  }

  async function login(email: string, password: string, role: UserRole) {
    const em = normalizeEmail(email)
    let usersRaw = localStorage.getItem("pharma.users") || "[]"
    let users: User[] = JSON.parse(usersRaw)

    if (users.length === 0) {
      await seedDemoUsers()
      usersRaw = localStorage.getItem("pharma.users") || "[]"
      users = JSON.parse(usersRaw)
    }

    users = await upgradeLegacyUsersIfNeeded(users)

    const passHash = await hashText(password)

    let u = users.find((x) => x.email.toLowerCase() === em && x.passwordHash === passHash && x.role === role) || null
    if (!u) {
      console.log("[v0] No exact hash match, attempting demo bypass if applicable.")
      const isOwnerDemo = em === "owner@shop" && password === "owner123" && role === "owner"
      const isWorkerDemo = em === "worker@shop" && password === "worker123" && role === "worker"

      if (isOwnerDemo || isWorkerDemo) {
        // Try to find by email+role ignoring hash, then repair passwordHash
        let demo = users.find((x) => x.email.toLowerCase() === em && x.role === role)
        if (!demo) {
          console.log("[v0] Demo user not found, force seeding.")
          await seedDemoUsers(true)
          const refreshed: User[] = JSON.parse(localStorage.getItem("pharma.users") || "[]")
          demo = refreshed.find((x) => x.email.toLowerCase() === em && x.role === role)
          users = refreshed
        }
        if (demo) {
          console.log("[v0] Repairing demo user's passwordHash to current algorithm.")
          const repaired = users.map((x) =>
            x.email.toLowerCase() === em && x.role === role ? { ...x, passwordHash: passHash } : x,
          )
          localStorage.setItem("pharma.users", JSON.stringify(repaired))
          u =
            repaired.find((x) => x.email.toLowerCase() === em && x.passwordHash === passHash && x.role === role) || null
        }
      }
    }

    if (!u) {
      return { ok: false, error: "Invalid credentials or role. Ensure the role matches the account." }
    }
    localStorage.setItem("pharma.user", JSON.stringify(u))
    setUser(u)
    return { ok: true }
  }

  function logout() {
    localStorage.removeItem("pharma.user")
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, logout }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function ProtectedRoute({
  children,
  allowed,
}: {
  children: React.ReactNode
  allowed: UserRole[]
}) {
  const { user } = useAuth()
  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/"
    return null
  }
  if (!allowed.includes(user.role)) {
    if (typeof window !== "undefined") window.location.href = "/"
    return null
  }
  return <>{children}</>
}

async function seedDemoUsers(force = false) {
  const usersRaw = localStorage.getItem("pharma.users") || "[]"
  const users: User[] = JSON.parse(usersRaw)
  if (force || users.length === 0) {
    const ownerPass = await hashText("owner123")
    const workerPass = await hashText("worker123")
    const demo: User[] = [
      { id: "u1", email: "owner@shop", role: "owner", passwordHash: ownerPass, name: "Owner" },
      { id: "u2", email: "worker@shop", role: "worker", passwordHash: workerPass, name: "Worker" },
    ]
    localStorage.setItem("pharma.users", JSON.stringify(demo))
  }
}
