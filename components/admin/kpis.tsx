"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type KpisData = {
  todayRevenue: number
  todayProfit: number
  monthRevenue: number
  monthProfit: number
}

export function Kpis({ kpis }: { kpis: KpisData }) {
  const items = [
    { label: "Today's Revenue", value: money(kpis.todayRevenue) },
    { label: "Today's Profit", value: money(kpis.todayProfit) },
    { label: "Monthly Revenue", value: money(kpis.monthRevenue) },
    { label: "Monthly Profit", value: money(kpis.monthProfit) },
  ]
  return (
    <>
      {items.map((k) => (
        <Card key={k.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{k.label}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{k.value}</CardContent>
        </Card>
      ))}
    </>
  )
}

function money(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "INR" }).format(n)
}
