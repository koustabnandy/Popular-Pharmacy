"use client"

import { useAuth, ProtectedRoute } from "@/components/auth/auth-context"
import { TopNav } from "@/components/nav/top-nav"
import { InventoryTable } from "@/components/inventory/inventory-table"

export default function InventoryPage() {
  return (
    <ProtectedRoute allowed={["owner", "worker"]}>
      <main className="min-h-dvh">
        <InventoryContent />
      </main>
    </ProtectedRoute>
  )
}

function InventoryContent() {
  const { logout } = useAuth()
  return (
    <>
      <TopNav current="inventory" onLogout={logout} />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div
          className="rounded-xl p-6 text-white"
          style={{
            background: "linear-gradient(90deg, var(--brand-blue) 0%, var(--brand-accent) 100%)",
          }}
        >
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="opacity-90">Add stock, manage suppliers, thresholds, and search.</p>
        </div>
        <div className="mt-6">
          <InventoryTable />
        </div>
      </section>
    </>
  )
}
