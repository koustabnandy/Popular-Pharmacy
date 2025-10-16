export type UserRole = "owner" | "worker"

export type User = {
  id: string
  email: string
  name: string
  role: UserRole
  passwordHash: string
}

export type Medicine = {
  id: string
  name: string
  supplier: string // MFG
  wholesaleCost: number
  price: number // MRP
  stockQty: number
  reorderThreshold: number
  pack: string // PACK
  batch: string // BATCH
  exp: string // EXP
  hsn: string // HSN
}

export type CartItem = {
  medicineId: string
  name: string
  qty: number
  unitPrice: number
  taxRate: number
  discount: number // percentage
  // for display/debugging:
  stockAtSale: number
}

export type Sale = {
  id: string
  createdAt: number // epoch ms
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  profit: number // computed from (price - cost) * qty
  paymentMethod: string
}
