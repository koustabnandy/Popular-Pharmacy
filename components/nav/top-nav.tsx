"use client"

import Link from "next/link"
import { useAuth } from "@/components/auth/auth-context"

export function TopNav({ current, onLogout }: { current?: "admin" | "worker" | "inventory"; onLogout?: () => void }) {
  const { user } = useAuth()
  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/placeholder-logo.svg" alt="Pharma Logo" className="h-7 w-7" />
          <span className="font-semibold">Popular Pharmacy</span>
        </div>
        <nav className="flex items-center gap-4">
          {user?.role === "owner" && (
            <Link className={linkCls(current === "admin")} href="/admin">
              Admin
            </Link>
          )}
          <Link className={linkCls(current === "worker")} href="/worker">
            Billing
          </Link>
          <Link className={linkCls(current === "inventory")} href="/inventory">
            Inventory
          </Link>
          <Link className="text-sm underline" href="/help">
            Help
          </Link>
          <button className="text-sm underline" onClick={onLogout}>
            Logout
          </button>
        </nav>
      </div>
    </header>
  )
}

function linkCls(active?: boolean) {
  return active ? "text-primary font-medium" : "text-foreground hover:text-primary"
}
