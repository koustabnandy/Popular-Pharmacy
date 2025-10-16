"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { localdb } from "@/lib/local-db"
import type { Medicine } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function InventoryTable() {
  const [query, setQuery] = useState("")
  const [version, setVersion] = useState(0)

  const [form, setForm] = useState({
    name: "",
    supplier: "",
    wholesaleCost: "",
    price: "",
    quantity: "",
  })

  useEffect(() => {
    localdb().ensureSeed()
    const id = setInterval(() => setVersion((v) => v + 1), 2000)
    return () => clearInterval(id)
  }, [])

  const meds = useMemo(() => localdb().searchMedicines(query), [query, version])

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { id, value } = e.target
    setForm((f) => ({ ...f, [id]: value }))
  }

  function addMedicine(e: React.FormEvent) {
    e.preventDefault()
    const name = form.name.trim()
    const supplier = form.supplier.trim()
    const wholesaleCost = Number.parseFloat(form.wholesaleCost)
    const price = Number.parseFloat(form.price)
    const quantity = Number.parseInt(form.quantity, 10)

    if (
      !name ||
      !supplier ||
      !Number.isFinite(wholesaleCost) ||
      !Number.isFinite(price) ||
      !Number.isInteger(quantity)
    ) {
      alert("Please fill all fields with valid values.")
      return
    }
    if (wholesaleCost < 0 || price <= 0 || quantity < 0) {
      alert("Values must be non-negative and price > 0.")
      return
    }

    localdb().addMedicine({
      name,
      supplier,
      wholesaleCost,
      price,
      quantity,
      reorderThreshold: 5, // default threshold
    })
    setForm({ name: "", supplier: "", wholesaleCost: "", price: "", quantity: "" })
    setVersion((v) => v + 1)
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 overflow-x-auto">
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search medicines by name or supplier"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search inventory"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meds.map((m: Medicine) => (
                <TableRow key={m.id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.supplier}</TableCell>
                  <TableCell className="text-right">{money(m.wholesaleCost)}</TableCell>
                  <TableCell className="text-right">{money(m.price)}</TableCell>
                  <TableCell className="text-right">{m.stockQty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Medicine</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addMedicine} className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={onChange} required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="supplier">Wholesale Supplier</Label>
              <Input id="supplier" value={form.supplier} onChange={onChange} required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="wholesaleCost">Wholesale Cost</Label>
              <Input
                id="wholesaleCost"
                type="number"
                step="0.01"
                value={form.wholesaleCost}
                onChange={onChange}
                required
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="price">Sale Price</Label>
              <Input id="price" type="number" step="0.01" value={form.price} onChange={onChange} required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" value={form.quantity} onChange={onChange} required />
            </div>
            <Button type="submit" className="bg-primary text-primary-foreground">
              Add Medicine
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-3">
            Validation ensures data integrity. Values must be valid and non-negative.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function money(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "INR" }).format(n)
}
