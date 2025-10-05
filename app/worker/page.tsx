"use client"

import { useAuth, ProtectedRoute } from "@/components/auth/auth-context"
import { TopNav } from "@/components/nav/top-nav"
import { BillingForm } from "@/components/worker/billing-form"

export default function WorkerPage() {
  return (
    <ProtectedRoute allowed={["worker", "owner"]}>
      <main className="min-h-dvh">
        <WorkerContent />
      </main>
    </ProtectedRoute>
  )
}

function WorkerContent() {
  const { logout } = useAuth()
  return (
    <>
      <TopNav current="worker" onLogout={logout} />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div
          className="rounded-xl p-6 text-white"
          style={{
            background: "linear-gradient(90deg, var(--brand-blue) 0%, var(--brand-accent) 100%)",
          }}
        >
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="opacity-90">Process a sale, apply GST, and prevent overselling.</p>
        </div>
        <div className="mt-6">
          <BillingForm />
        </div>
      </section>
    </>
  )
}
