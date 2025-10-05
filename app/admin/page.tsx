"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useAuth, ProtectedRoute } from "@/components/auth/auth-context"
import { TopNav } from "@/components/nav/top-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SalesChart } from "@/components/admin/sales-chart"
import { Kpis } from "@/components/admin/kpis"
import { localdb } from "@/lib/local-db"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  return (
    <ProtectedRoute allowed={["owner"]}>
      <AdminContent />
    </ProtectedRoute>
  )
}

function AdminContent() {
  const { logout } = useAuth()
  const [version, setVersion] = useState(0)
  const hydrated = useRef(false)

  // ✅ Delay polling until after first hydration
  useEffect(() => {
    hydrated.current = true
    const id = setInterval(() => {
      if (hydrated.current) setVersion((v) => v + 1)
    }, 2000)
    return () => clearInterval(id)
  }, [])

  const kpiData = useMemo(() => localdb().getKpis(), [version])
  const chartData = useMemo(() => localdb().getSalesTrend(30), [version])
  const bestSellers = useMemo(() => localdb().getBestSellers(5), [version])
  const lowStock = useMemo(() => localdb().getLowStock(), [version])

  return (
    <main className="min-h-dvh">
      <TopNav current="admin" onLogout={logout} />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div
          className="rounded-xl p-6 text-white"
          style={{
            background:
              "linear-gradient(90deg, var(--brand-blue) 0%, var(--brand-accent) 100%)",
          }}
        >
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="opacity-90">
            Overview of profits, sales, and inventory health.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <Kpis kpis={kpiData} />
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Sales Trend (Last 30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesChart data={chartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best Sellers</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-2">
                {bestSellers.map((b) => (
                  <li key={b.medicineId} className="flex justify-between">
                    <span>{b.name}</span>
                    <span className="text-muted-foreground">{b.qty} sold</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Low / Out of Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {lowStock.length === 0 ? (
                <p className="text-muted-foreground">
                  No alerts. Inventory is healthy.
                </p>
              ) : (
                <ul className="space-y-2" aria-live="polite">
                  {lowStock.map((m) => (
                    <li key={m.id} className="flex justify-between">
                      <span>{m.name}</span>
                      <span className="text-red-600 font-medium">
                        {m.stockQty === 0 ? "Out of stock" : `Low: ${m.stockQty}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4">
                <Link href="/inventory" className="underline text-sm">
                  Go to Inventory
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Link href="/inventory">
                <Button>Manage Inventory</Button>
              </Link>
              <Link href="/worker">
                <Button variant="secondary">Open Billing</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
