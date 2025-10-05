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
  supplier: string
  wholesaleCost: number
  price: number
  stockQty: number
  reorderThreshold: number
}

export type CartItem = {
  medicineId: string
  name: string
  qty: number
  unitPrice: number
  taxRate: number
  // for display/debugging:
  stockAtSale: number
}

export type Sale = {
  id: string
  createdAt: number // epoch ms
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  profit: number // computed from (price - cost) * qty
}
