"use client"

import { useMemo, useState } from "react"
import { localdb } from "@/lib/local-db"
import type { Sale } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function BillingHistory() {
  const [filter, setFilter] = useState("30") // days

  const allSales = useMemo(() => localdb().getAllSales?.() || [], [])

  const filteredSales = useMemo(() => {
    const now = Date.now()
    const daysAgo = now - (Number(filter) * 24 * 60 * 60 * 1000)
    return allSales.filter(s => s.createdAt >= daysAgo)
  }, [allSales, filter])

  function downloadCSV() {
    const headers = ["Date", "Items", "Subtotal", "Discount", "GST", "Total", "Payment Method", "Profit"]
    const rows = filteredSales.map(s => [
      new Date(s.createdAt).toLocaleDateString(),
      s.items.map(i => `${i.name} (${i.qty})`).join("; "),
      money(s.subtotal),
      money(s.discount),
      money(s.tax),
      money(s.total),
      s.paymentMethod,
      money(s.profit)
    ])

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `billing-history-${filter}-days.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="mt-6 no-print">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Billing History</CardTitle>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Day</SelectItem>
                <SelectItem value="5">5 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={downloadCSV}>Download CSV</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">GST</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{s.items.map(i => `${i.name} (${i.qty})`).join(", ")}</TableCell>
                <TableCell className="text-right">{money(s.subtotal)}</TableCell>
                <TableCell className="text-right">{money(s.discount)}</TableCell>
                <TableCell className="text-right">{money(s.tax)}</TableCell>
                <TableCell className="text-right">{money(s.total)}</TableCell>
                <TableCell>{s.paymentMethod}</TableCell>
                <TableCell className="text-right">{money(s.profit)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function money(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "INR" }).format(n)
}