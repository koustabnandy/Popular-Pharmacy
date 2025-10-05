"use client"

import { useMemo, useState } from "react"
import { localdb } from "@/lib/local-db"
import type { Medicine, CartItem } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Command, CommandInput, CommandItem, CommandList, CommandGroup, CommandEmpty } from "@/components/ui/command"

export function BillingForm() {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Medicine | null>(null)
  const [qty, setQty] = useState(1)
  const [tax, setTax] = useState(15) // default 15% GST
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [customerName, setCustomerName] = useState("")

  const meds = useMemo(() => localdb().searchMedicines(query), [query])

  function addItem() {
    if (!selected) return
    if (qty <= 0) return alert("Quantity must be positive.")
    if (qty > selected.stockQty) {
      alert(`Insufficient stock. Available: ${selected.stockQty}`)
      return
    }
    const item: CartItem = {
      medicineId: selected.id,
      name: selected.name,
      qty,
      unitPrice: selected.price,
      taxRate: tax,
      stockAtSale: selected.stockQty,
    }
    setCart((c) => [...c, item])
    setSelected(null)
    setQty(1)
    setTax(15)
    setQuery("")
  }

  function removeItem(idx: number) {
    setCart((c) => c.filter((_, i) => i !== idx))
  }

  function updateQty(idx: number, newQty: number) {
    if (newQty <= 0) return
    setCart((c) => c.map((item, i) => i === idx ? { ...item, qty: newQty } : item))
  }

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0)
  const taxTotal = cart.reduce((s, i) => s + (i.unitPrice * i.qty * i.taxRate) / 100, 0)
  const total = subtotal + taxTotal

  function confirmPayment() {
    if (cart.length === 0) return
    // Validate stock again before recording
    for (const i of cart) {
      const m = localdb().getMedicineById(i.medicineId)
      if (!m || i.qty > m.stockQty) {
        alert(`Stock changed. Cannot sell ${i.name}.`)
        return
      }
    }
    localdb().recordSale(cart)
    setCart([])
    setPaymentOpen(false)
    alert("Payment processed (mock) and sale recorded.")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Bill</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="grid gap-3">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter customer name" />
            </div>
            <div>
              <Label>Search Medicine</Label>
              <Command>
                <CommandInput placeholder="Type a medicine name..." value={query} onValueChange={setQuery} />
                <CommandList>
                  <CommandEmpty>No medicine found.</CommandEmpty>
                  <CommandGroup>
                    {meds.map((m) => (
                      <CommandItem
                        key={m.id}
                        value={m.name}
                        onSelect={() => {
                          setSelected(m)
                          setQuery(m.name)
                        }}
                      >
                        <div className="flex w-full justify-between">
                          <span>{m.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {money(m.price)} • Stock: {m.stockQty}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>

            {selected && (
              <div className="grid md:grid-cols-3 gap-3 items-end">
                <div className="grid gap-1">
                  <Label>Selected</Label>
                  <Input value={selected.name} readOnly />
                </div>
                <div className="grid gap-1">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Number.parseInt(e.target.value || "1", 10))}
                    aria-describedby="stock-hint"
                  />
                  <span id="stock-hint" className="text-xs text-muted-foreground">
                    In stock: {selected.stockQty}
                  </span>
                </div>
                <div className="grid gap-1">
                  <Label>GST %</Label>
                  <Input
                    type="number"
                    min={0}
                    value={tax}
                    onChange={(e) => setTax(Number.parseFloat(e.target.value || "0"))}
                  />
                </div>
                <div className="md:col-span-3">
                  <Button onClick={addItem}>Add to Cart</Button>
                </div>
              </div>
            )}

            <div className="mt-2">
              <h3 className="font-medium mb-2">Cart</h3>
              <div className="rounded-md border">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">No items.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="p-3">Medicine</th>
                        <th className="p-3">Qty</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Tax %</th>
                        <th className="p-3 text-right">Line Total</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((i, idx) => {
                        const line = i.unitPrice * i.qty
                        const lt = line + (line * i.taxRate) / 100
                        return (
                          <tr key={idx} className="border-t">
                            <td className="p-3">{i.name}</td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min={1}
                                value={i.qty}
                                onChange={(e) => updateQty(idx, Number.parseInt(e.target.value || "1", 10))}
                                className="w-16"
                              />
                            </td>
                            <td className="p-3 text-right">{money(i.unitPrice)}</td>
                            <td className="p-3 text-right">{i.taxRate}%</td>
                            <td className="p-3 text-right">{money(lt)}</td>
                            <td className="p-3 text-right">
                              <button className="text-red-600 underline" onClick={() => removeItem(idx)}>
                                Remove
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>Print Bill</Button>
            <Button variant="outline" onClick={() => alert("Download feature coming soon!")}>Download Bill</Button>
          </div>
          <div className="rounded-md border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>{money(taxTotal)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
          </div>

          <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
            <DialogTrigger asChild>
              <Button disabled={cart.length === 0}>Process Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Payment (Mock)</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p>For demo purposes, payment is simulated. No sensitive data is collected.</p>
                <div className="grid gap-1">
                  <Label>Payment Method</Label>
                  <select className="border rounded-md h-9 px-2 bg-background" defaultValue="cash">
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total to pay</span>
                  <span className="font-medium">{money(total)}</span>
                </div>
                <Button onClick={confirmPayment} className="w-full">
                  Confirm
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

function money(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "INR" }).format(n)
}
