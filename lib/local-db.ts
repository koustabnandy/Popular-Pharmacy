import type { CartItem, Medicine, Sale } from "./types"

type DBShape = {
  medicines: Medicine[]
  sales: Sale[]
}

let cached: DBShape | null = null

export function localdb() {
  if (!cached) {
    cached = read()
  }
  return {
    ensureSeed,
    getAllMedicines,
    searchMedicines,
    getMedicineById,
    addMedicine,
    recordSale,
    getKpis,
    getBestSellers,
    getSalesTrend,
    getLowStock,
  }
}

function read(): DBShape {
  if (typeof window === "undefined") return { medicines: [], sales: [] }
  const raw = localStorage.getItem("pharma.db")
  if (!raw) return { medicines: [], sales: [] }
  try {
    return JSON.parse(raw) as DBShape
  } catch {
    return { medicines: [], sales: [] }
  }
}

function write(db: DBShape) {
  if (typeof window === "undefined") return
  localStorage.setItem("pharma.db", JSON.stringify(db))
  cached = db
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function ensureSeed() {
  const db = read()
  if (db.medicines.length === 0) {
    db.medicines = [
      mkMed("Paracetamol 500mg", "Wellness Wholesale", 0.1, 0.4, 200, 20),
      mkMed("Ibuprofen 200mg", "HealthSuppliers Inc.", 0.12, 0.5, 150, 15),
      mkMed("Cough Syrup 100ml", "CarePharma", 1.2, 2.0, 80, 10),
      mkMed("Vitamin C 1000mg", "NutriChain", 0.2, 0.8, 120, 20),
      mkMed("Antacid Tabs", "GastroGood", 0.08, 0.4, 90, 10),
    ]
    db.sales = []
    write(db)
  }
}

function mkMed(name: string, supplier: string, cost: number, price: number, qty: number, th: number): Medicine {
  return { id: uid("med"), name, supplier, wholesaleCost: cost, price, stockQty: qty, reorderThreshold: th }
}

function getAllMedicines() {
  return read().medicines
}

function searchMedicines(q: string) {
  const db = read()
  if (!q.trim()) return db.medicines
  const s = q.toLowerCase()
  return db.medicines.filter((m) => m.name.toLowerCase().includes(s) || m.supplier.toLowerCase().includes(s))
}

function getMedicineById(id: string) {
  const db = read()
  return db.medicines.find((m) => m.id === id)
}

function addMedicine(input: {
  name: string
  supplier: string
  wholesaleCost: number
  price: number
  quantity: number
  reorderThreshold: number
}) {
  const db = read()
  const existing = db.medicines.find((m) => m.name.toLowerCase() === input.name.toLowerCase())
  if (existing) {
    // increment stock if same name already exists
    existing.stockQty += input.quantity
    existing.wholesaleCost = input.wholesaleCost
    existing.price = input.price
    existing.reorderThreshold = input.reorderThreshold
  } else {
    db.medicines.push({
      id: uid("med"),
      name: input.name,
      supplier: input.supplier,
      wholesaleCost: input.wholesaleCost,
      price: input.price,
      stockQty: input.quantity,
      reorderThreshold: input.reorderThreshold,
    })
  }
  write(db)
}

function recordSale(items: CartItem[]) {
  const db = read()
  // Decrement stock and compute totals
  let subtotal = 0
  let tax = 0
  let profit = 0
  for (const i of items) {
    const m = db.medicines.find((mm) => mm.id === i.medicineId)
    if (!m) throw new Error("Medicine missing")
    if (i.qty > m.stockQty) throw new Error("Insufficient stock")
    subtotal += i.unitPrice * i.qty
    tax += (i.unitPrice * i.qty * i.taxRate) / 100
    profit += (i.unitPrice - m.wholesaleCost) * i.qty
    m.stockQty -= i.qty
  }
  const sale: Sale = {
    id: uid("sale"),
    createdAt: Date.now(),
    items,
    subtotal,
    tax,
    total: subtotal + tax,
    profit,
  }
  db.sales.unshift(sale)
  write(db)
}

function getKpis() {
  const db = read()
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  const todaySales = db.sales.filter((s) => s.createdAt >= startOfToday)
  const monthSales = db.sales.filter((s) => s.createdAt >= startOfMonth)

  const todayRevenue = sum(todaySales.map((s) => s.total))
  const todayProfit = sum(todaySales.map((s) => s.profit))
  const monthRevenue = sum(monthSales.map((s) => s.total))
  const monthProfit = sum(monthSales.map((s) => s.profit))

  return { todayRevenue, todayProfit, monthRevenue, monthProfit }
}

function getBestSellers(limit = 5) {
  const db = read()
  const map = new Map<string, { medicineId: string; name: string; qty: number }>()
  for (const s of db.sales) {
    for (const i of s.items) {
      const entry = map.get(i.medicineId) || { medicineId: i.medicineId, name: i.name, qty: 0 }
      entry.qty += i.qty
      map.set(i.medicineId, entry)
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit)
}

function getSalesTrend(days = 30) {
  const db = read()
  const res: Array<{ date: string; total: number }> = []
  const today = new Date()
  for (let d = days - 1; d >= 0; d--) {
    const day = new Date(today)
    day.setDate(today.getDate() - d)
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()
    const end = start + 86400000
    const sales = db.sales.filter((s) => s.createdAt >= start && s.createdAt < end)
    res.push({
      date: day.toLocaleDateString(),
      total: sum(sales.map((s) => s.total)),
    })
  }
  return res
}

function getLowStock() {
  const db = read()
  return db.medicines.filter((m) => m.stockQty <= m.reorderThreshold)
}

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0)
}
