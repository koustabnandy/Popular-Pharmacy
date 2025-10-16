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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, Download, CreditCard } from "lucide-react"

export function BillingForm() {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Medicine | null>(null)
  const [qty, setQty] = useState(1)
  const [tax, setTax] = useState(18) // default 18% GST
  const [discount, setDiscount] = useState(15) // default 15% discount
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [memoNumber, setMemoNumber] = useState(1001) // auto-increment
  const [address, setAddress] = useState("") // user will add later

  const meds = useMemo(() => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return [] as Medicine[]
    return localdb().searchMedicines(trimmedQuery).filter((m) => m.stockQty > 0)
  }, [query])
  const allMeds = useMemo(() => localdb().getAllMedicines(), [])
  const hasQuery = query.trim().length > 0

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
      discount,
      stockAtSale: selected.stockQty,
    }
    setCart((c) => [...c, item])
    setSelected(null)
    setQty(1)
    setTax(18)
    setDiscount(15)
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
  const discountTotal = cart.reduce((s, i) => s + (i.unitPrice * i.qty * i.discount) / 100, 0)
  const taxTotal = cart.reduce((s, i) => {
    const line = i.unitPrice * i.qty
    const disc = (line * i.discount) / 100
    return s + ((line - disc) * i.taxRate) / 100
  }, 0)
  const total = subtotal - discountTotal + taxTotal

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
    localdb().recordSale(cart, paymentMethod)
    setCart([])
    setPaymentOpen(false)
    setMemoNumber(prev => prev + 1) // increment memo
    alert("Payment processed (mock) and sale recorded.")
  }

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          #print-bill { display: block !important; width: 100%; font-size: 14px; margin: 0 auto; }
          @page { size: A4; margin: 20mm; }
        }
        #print-bill { display: none; }
      `}</style>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Billing Interface</CardTitle>
          </CardHeader>
          <CardContent className="billing-print">
            <div id="print-bill" className="p-6 border border-gray-300 rounded-lg bg-white text-black font-serif">
              <div className="text-center mb-4">
                <h1 className="text-3xl font-bold">POPULAR PHARMACY</h1>
                <p className="text-sm">Your Trusted Healthcare Partner</p>
                <p className="text-sm">Address: [Add your address here]</p>
              </div>
              <div className="flex justify-between mb-4 text-sm">
                <div>
                  <strong>Memo No:</strong> {memoNumber}
                </div>
                <div>
                  <strong>Date:</strong> {new Date().toLocaleDateString()} <strong>Time:</strong> {new Date().toLocaleTimeString()}
                </div>
              </div>
              <div className="mb-4 text-sm">
                <strong>Customer Name:</strong> {customerName || "Walk-in"}
                <br />
                <strong>Address:</strong> {address || "[Customer Address]"}
              </div>
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 p-1">QTY</th>
                    <th className="border border-gray-400 p-1">MFG</th>
                    <th className="border border-gray-400 p-1">PRODUCT NAME</th>
                    <th className="border border-gray-400 p-1">PACK</th>
                    <th className="border border-gray-400 p-1">BATCH</th>
                    <th className="border border-gray-400 p-1">EXP</th>
                    <th className="border border-gray-400 p-1">MRP</th>
                    <th className="border border-gray-400 p-1">RATE</th>
                    <th className="border border-gray-400 p-1">DIS%</th>
                    <th className="border border-gray-400 p-1">GST%</th>
                    <th className="border border-gray-400 p-1">AMOUNT</th>
                    <th className="border border-gray-400 p-1">HSN</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => {
                    const med = localdb().getMedicineById(item.medicineId)
                    if (!med) return null
                    const line = item.unitPrice * item.qty
                    const discAmount = (line * item.discount) / 100
                    const taxable = line - discAmount
                    const gstAmount = (taxable * item.taxRate) / 100
                    const amount = taxable + gstAmount
                    return (
                      <tr key={idx}>
                        <td className="border border-gray-400 p-1 text-center">{item.qty}</td>
                        <td className="border border-gray-400 p-1">{med.supplier}</td>
                        <td className="border border-gray-400 p-1">{item.name}</td>
                        <td className="border border-gray-400 p-1">{med.pack}</td>
                        <td className="border border-gray-400 p-1">{med.batch}</td>
                        <td className="border border-gray-400 p-1">{med.exp}</td>
                        <td className="border border-gray-400 p-1 text-right">{money(item.unitPrice)}</td>
                        <td className="border border-gray-400 p-1 text-right">{money(item.unitPrice)}</td>
                        <td className="border border-gray-400 p-1 text-right">{item.discount}%</td>
                        <td className="border border-gray-400 p-1 text-right">{item.taxRate}%</td>
                        <td className="border border-gray-400 p-1 text-right">{money(amount)}</td>
                        <td className="border border-gray-400 p-1">{med.hsn}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="mt-4 text-sm">
                <div className="flex justify-end space-y-1 flex-col items-end">
                  <div>Gross Amount: {money(subtotal)}</div>
                  <div>Total Discount: {money(discountTotal)}</div>
                  <div>GST Amount: {money(taxTotal)}</div>
                  <div className="font-bold">Net Payable: {money(total)}</div>
                </div>
                <div className="mt-2">
                  <strong>Net Amount in Words:</strong> {numberToWords(total)}
                </div>
              </div>
              <div className="text-center mt-6 text-sm">
                Thank you for your business!
              </div>
            </div>
            <div className="grid gap-3 no-print">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter customer name" />
              </div>
              
              <div className="no-print">
                <Label>Search Medicine</Label>
                <Command>
                  <CommandInput
                    placeholder="Type a medicine name..."
                    value={query}
                    onValueChange={setQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No medicine found.</CommandEmpty>
                    {hasQuery && (
                      <CommandGroup>
                        {meds.map((m) => (
                          <CommandItem
                            key={m.id}
                            value={m.name}
                            onSelect={() => {
                              setSelected(m)
                              setQuery("")
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
                    )}
                  </CommandList>
                </Command>
              </div>

              {selected && (
                <div className="grid md:grid-cols-4 gap-3 items-end no-print">
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
                  <div className="grid gap-1">
                    <Label>Discount %</Label>
                    <Input
                      type="number"
                      min={0}
                      value={discount}
                      onChange={(e) => setDiscount(Number.parseFloat(e.target.value || "0"))}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Button onClick={addItem}>Add to Cart</Button>
                  </div>
                </div>
              )}

              <div className="mt-2">
                <h3 className="font-medium mb-2">Selected Medicines</h3>
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
                          <th className="p-3 text-right">GST %</th>
                          <th className="p-3 text-right">Discount %</th>
                          <th className="p-3 text-right">Line Total</th>
                          <th className="p-3 no-print"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((i, idx) => {
                          const line = i.unitPrice * i.qty
                          const discAmount = (line * i.discount) / 100
                          const taxable = line - discAmount
                          const taxAmount = (taxable * i.taxRate) / 100
                          const lt = taxable + taxAmount
                          return (
                            <tr key={idx} className="border-t">
                              <td className="p-3">{i.name}</td>
                              <td className="p-3">
                                <Input
                                  type="number"
                                  min={1}
                                  value={i.qty}
                                  onChange={(e) => updateQty(idx, Number.parseInt(e.target.value || "1", 10))}
                                  className="w-16 no-print"
                                />
                                <span className="print-section">{i.qty}</span>
                              </td>
                              <td className="p-3 text-right">{money(i.unitPrice)}</td>
                              <td className="p-3 text-right">{i.taxRate}%</td>
                              <td className="p-3 text-right">{i.discount}%</td>
                              <td className="p-3 text-right">{money(lt)}</td>
                              <td className="p-3 text-right no-print">
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

              <div className="space-y-3">
                <div className="flex gap-2 no-print">
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Bill
                  </Button>
                  <Button variant="outline" onClick={() => alert("Download feature coming soon!")}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Bill
                  </Button>
                </div>
                <div className="rounded-md border p-4 space-y-2">
                  {customerName && <div className="text-sm font-medium">Customer: {customerName}</div>}
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount</span>
                    <span>{money(discountTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GST</span>
                    <span>{money(taxTotal)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{money(total)}</span>
                  </div>
                  {paymentMethod && <div className="text-sm">Payment Method: {paymentMethod}</div>}
                </div>

                <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={cart.length === 0} className="no-print">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Process Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Payment (Mock)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                      <p>For demo purposes, payment is simulated. No sensitive data is collected.</p>
                      <div className="grid gap-1">
                        <Label>Payment Method</Label>
                        <select
                          className="border rounded-md h-9 px-2 bg-background"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
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
            </div>
          </CardContent>
        </Card>

        <Card className="no-print">
          <CardHeader>
            <CardTitle>Inventory/Stock Section</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableHead>Name</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableHeader>
              <TableBody>
                {allMeds.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell className="text-muted-foreground">{m.supplier}</TableCell>
                    <TableCell className="text-right">{money(m.price)}</TableCell>
                    <TableCell className="text-right">{m.stockQty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function money(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "INR" }).format(n)
}

function numberToWords(num: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const thousands = ['', 'Thousand', 'Lakh', 'Crore']

  function convertToWords(n: number): string {
    if (n === 0) return ''
    if (n < 10) return units[n]
    if (n < 20) return teens[n - 10]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '')
    if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertToWords(n % 100) : '')
    for (let i = 1; i < thousands.length; i++) {
      if (n < Math.pow(100, i + 1)) {
        return convertToWords(Math.floor(n / Math.pow(100, i))) + ' ' + thousands[i] + (n % Math.pow(100, i) !== 0 ? ' ' + convertToWords(n % Math.pow(100, i)) : '')
      }
    }
    return ''
  }

  const integerPart = Math.floor(num)
  const decimalPart = Math.round((num - integerPart) * 100)

  let words = convertToWords(integerPart) + ' Rupees'
  if (decimalPart > 0) {
    words += ' and ' + convertToWords(decimalPart) + ' Paise'
  }
  return words || 'Zero Rupees'
}
