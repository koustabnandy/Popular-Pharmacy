"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const router = useRouter()
  const { user, login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"owner" | "worker">("owner")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
  if (user?.role === "owner") {
    router.replace("/admin")
  } else if (user?.role === "worker") {
    router.replace("/worker")
  }
}, [user, router])


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await login(email, password, role)
    if (res.ok) {
  // Redirect based on role
  if (role === "owner") router.replace("/admin")
  else if (role === "worker") router.replace("/worker")
} else {
  setError(res.error || "Login failed")
}

  }

  function onResetDemo() {
    localStorage.removeItem("pharma.users")
    localStorage.removeItem("pharma.user")
    setError("Demo data reset. Try signing in again.")
  }

  return (
    <main className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/placeholder-logo.svg" alt="Pharma Logo" className="h-8 w-8" />
            <span className="font-semibold">Popular Pharmacy</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/help" className="text-sm underline">
              Help
            </Link>
          </nav>
        </div>
      </header>

      <section className={cn("border-b")}>
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div
            className="rounded-xl p-8 text-center"
            style={{
              background: "linear-gradient(90deg, var(--brand-blue) 0%, var(--brand-accent) 100%)",
              color: "white",
            }}
          >
            <h1 className="text-3xl md:text-4xl font-semibold text-balance">Streamlined Retail Pharmacy Management</h1>
            <p className="mt-3 text-pretty opacity-95">Billing, inventory, analytics, and alerts — all in one place.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-2 gap-8">
        <Card className="border">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  required
                  placeholder="owner@shop or worker@shop"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="border rounded-md h-10 px-3 bg-background"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  aria-label="Choose role"
                >
                  <option value="owner">Shop Owner</option>
                  <option value="worker">Worker</option>
                </select>
              </div>
              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
              <div className="flex items-center gap-3">
                <Button type="submit" className="bg-primary text-primary-foreground">
                  Sign in
                </Button>
                <Button type="button" variant="outline" onClick={onResetDemo}>
                  Reset demo data
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Demo accounts: owner@shop / owner123 (Shop Owner), worker@shop / worker123 (Worker).
              </p>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Admin Dashboard: P&amp;L, best-sellers, trend charts.</p>
            <p>• Worker Billing: GST, stock checks, mock payment.</p>
            <p>• Inventory: Add stock, suppliers, thresholds, search, alerts.</p>
            <p>• Auth &amp; RBAC: Owner and Worker roles.</p>
            <p>• Light, responsive design with white/blue theme and gradient accents.</p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
