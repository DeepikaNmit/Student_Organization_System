import { nowIso, read, uid, wait, write } from '../mocks/store'
import { pushNotification } from '../mocks/notify'
import { requireAdmin, requireUser, sessionUser, loadUsers, toUser } from './auth'
import { ApiError } from './http'
import { appendAuditLog } from './auditLog'

// ---------- Types ----------
export interface Product {
  id: string
  name: string
  description: string
  imageUrl: string
  category: string
  variants: ProductVariant[]
  memberDiscount: number // percent, 0-100
  active: boolean
  createdAt: string
}

export interface ProductVariant {
  id: string
  label: string // e.g. "S", "M", "L"
  priceInr: number
  stock: number
}

export interface CartItem {
  productId: string
  variantId: string
  qty: number
}

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED'

export interface Order {
  id: string
  userId: string
  userName: string
  items: {
    productId: string
    productName: string
    variantLabel: string
    qty: number
    unitPriceInr: number
    discountPct: number
  }[]
  totalInr: number
  status: OrderStatus
  createdAt: string
}

// ---------- Keys ----------
const PRODUCTS_KEY = 'products'
const CART_KEY_PREFIX = 'cart_'
const ORDERS_KEY = 'orders'

// ---------- Seed data ----------
const seedProducts = (): Product[] => [
  {
    id: 'prod_tshirt',
    name: 'Clustro Classic Tee',
    description: 'Soft cotton crew-neck with the Clustro logo. Available in four sizes.',
    imageUrl: '',
    category: 'Apparel',
    variants: [
      { id: 'v_s', label: 'S', priceInr: 499, stock: 20 },
      { id: 'v_m', label: 'M', priceInr: 499, stock: 35 },
      { id: 'v_l', label: 'L', priceInr: 499, stock: 25 },
      { id: 'v_xl', label: 'XL', priceInr: 549, stock: 15 },
    ],
    memberDiscount: 10,
    active: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'prod_hoodie',
    name: 'Clustro Hoodie',
    description: 'Heavyweight fleece pullover hoodie with embroidered logo.',
    imageUrl: '',
    category: 'Apparel',
    variants: [
      { id: 'v_h_m', label: 'M', priceInr: 1299, stock: 10 },
      { id: 'v_h_l', label: 'L', priceInr: 1299, stock: 12 },
      { id: 'v_h_xl', label: 'XL', priceInr: 1349, stock: 8 },
    ],
    memberDiscount: 15,
    active: true,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'prod_sticker',
    name: 'Sticker Pack (5)',
    description: 'Five die-cut vinyl stickers featuring Clustro mascot and event logos.',
    imageUrl: '',
    category: 'Accessories',
    variants: [
      { id: 'v_stk', label: 'Standard', priceInr: 99, stock: 100 },
    ],
    memberDiscount: 0,
    active: true,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'prod_mug',
    name: 'Clustro Ceramic Mug',
    description: '350 ml glossy white mug with wraparound print.',
    imageUrl: '',
    category: 'Accessories',
    variants: [
      { id: 'v_mug', label: 'Standard', priceInr: 349, stock: 40 },
    ],
    memberDiscount: 5,
    active: true,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
]

const seedOrders = (): Order[] => []

// ---------- Helpers ----------
export const loadProducts = () => read<Product[]>(PRODUCTS_KEY, seedProducts)
const saveProducts = (p: Product[]) => write(PRODUCTS_KEY, p)
const loadOrders = () => read<Order[]>(ORDERS_KEY, seedOrders)
const saveOrders = (o: Order[]) => write(ORDERS_KEY, o)
const cartKey = (userId: string) => CART_KEY_PREFIX + userId
const loadCart = (userId: string) => read<CartItem[]>(cartKey(userId), () => [])
const saveCart = (userId: string, c: CartItem[]) => write(cartKey(userId), c)

// ---------- Product catalog ----------
export async function listProducts(): Promise<Product[]> {
  await wait()
  return loadProducts().filter((p) => p.active)
}

export async function allProducts(): Promise<Product[]> {
  await wait()
  requireAdmin()
  return loadProducts()
}

export async function getProduct(id: string): Promise<Product> {
  await wait(80)
  const p = loadProducts().find((x) => x.id === id)
  if (!p) throw new ApiError('Product not found.', 404)
  return p
}

export async function createProduct(input: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  await wait()
  requireAdmin()
  const products = loadProducts()
  const p: Product = { ...input, id: uid('prod'), createdAt: nowIso() }
  products.push(p)
  saveProducts(products)
  appendAuditLog('ADMIN', `Created product "${p.name}"`)
  return p
}

export async function updateProduct(id: string, patch: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product> {
  await wait()
  requireAdmin()
  const products = loadProducts()
  const idx = products.findIndex((x) => x.id === id)
  if (idx === -1) throw new ApiError('Product not found.', 404)
  Object.assign(products[idx], patch)
  saveProducts(products)
  appendAuditLog('ADMIN', `Updated product "${products[idx].name}"`)
  return products[idx]
}

export async function updateStock(productId: string, variantId: string, newStock: number): Promise<Product> {
  await wait()
  requireAdmin()
  if (newStock < 0) throw new ApiError('Stock cannot be negative.', 400)
  const products = loadProducts()
  const p = products.find((x) => x.id === productId)
  if (!p) throw new ApiError('Product not found.', 404)
  const v = p.variants.find((x) => x.id === variantId)
  if (!v) throw new ApiError('Variant not found.', 404)
  v.stock = newStock
  saveProducts(products)
  appendAuditLog('INVENTORY', `Stock updated: ${p.name} (${v.label}) → ${newStock}`)
  if (newStock <= 5 && newStock > 0) {
    const admins = loadUsers().filter((u) => u.role === 'ADMIN')
    admins.forEach((a) => pushNotification(a.id, 'Low stock alert', `${p.name} (${v.label}) has only ${newStock} units left.`))
  }
  return p
}

// ---------- Cart ----------
export async function getCart(): Promise<CartItem[]> {
  await wait(80)
  const u = requireUser()
  return loadCart(u.id)
}

export async function addToCart(productId: string, variantId: string, qty: number): Promise<CartItem[]> {
  await wait()
  const u = requireUser()
  if (qty < 1) throw new ApiError('Quantity must be at least 1.', 400)
  const products = loadProducts()
  const p = products.find((x) => x.id === productId)
  if (!p || !p.active) throw new ApiError('Product not found or unavailable.', 404)
  const v = p.variants.find((x) => x.id === variantId)
  if (!v) throw new ApiError('Variant not found.', 404)
  const cart = loadCart(u.id)
  const existing = cart.find((c) => c.productId === productId && c.variantId === variantId)
  const currentQty = existing ? existing.qty : 0
  if (currentQty + qty > v.stock) throw new ApiError(`Only ${v.stock - currentQty} units available.`, 400)
  if (existing) {
    existing.qty += qty
  } else {
    cart.push({ productId, variantId, qty })
  }
  saveCart(u.id, cart)
  return cart
}

export async function updateCartQty(productId: string, variantId: string, qty: number): Promise<CartItem[]> {
  await wait()
  const u = requireUser()
  const cart = loadCart(u.id)
  const idx = cart.findIndex((c) => c.productId === productId && c.variantId === variantId)
  if (idx === -1) throw new ApiError('Item not in cart.', 404)
  if (qty <= 0) {
    cart.splice(idx, 1)
  } else {
    const products = loadProducts()
    const p = products.find((x) => x.id === productId)
    const v = p?.variants.find((x) => x.id === variantId)
    if (v && qty > v.stock) throw new ApiError(`Only ${v.stock} units available.`, 400)
    cart[idx].qty = qty
  }
  saveCart(u.id, cart)
  return cart
}

export async function removeFromCart(productId: string, variantId: string): Promise<CartItem[]> {
  return updateCartQty(productId, variantId, 0)
}

export async function clearCart(): Promise<CartItem[]> {
  await wait(80)
  const u = requireUser()
  saveCart(u.id, [])
  return []
}

// ---------- Checkout ----------
export async function checkout(): Promise<Order> {
  await wait()
  const u = requireUser()
  const cart = loadCart(u.id)
  if (cart.length === 0) throw new ApiError('Cart is empty.', 400)
  const products = loadProducts()
  const isMember = u.role === 'MEMBER'

  // Validate stock and build order items
  const orderItems: Order['items'] = []
  let total = 0

  for (const ci of cart) {
    const p = products.find((x) => x.id === ci.productId)
    if (!p || !p.active) throw new ApiError(`Product "${ci.productId}" is no longer available.`, 400)
    const v = p.variants.find((x) => x.id === ci.variantId)
    if (!v) throw new ApiError(`Variant not found for ${p.name}.`, 400)
    if (ci.qty > v.stock) throw new ApiError(`Insufficient stock for ${p.name} (${v.label}). Only ${v.stock} left.`, 400)
    const discountPct = isMember ? p.memberDiscount : 0
    const unitPrice = Math.round(v.priceInr * (1 - discountPct / 100))
    orderItems.push({
      productId: p.id,
      productName: p.name,
      variantLabel: v.label,
      qty: ci.qty,
      unitPriceInr: unitPrice,
      discountPct,
    })
    total += unitPrice * ci.qty
    // Deduct stock
    v.stock -= ci.qty
  }
  saveProducts(products)

  const order: Order = {
    id: uid('ord'),
    userId: u.id,
    userName: u.name,
    items: orderItems,
    totalInr: total,
    status: 'CONFIRMED',
    createdAt: nowIso(),
  }
  const orders = loadOrders()
  orders.unshift(order)
  saveOrders(orders)

  // Clear cart
  saveCart(u.id, [])

  pushNotification(u.id, 'Order confirmed', `Your order #${order.id} for ₹${total.toLocaleString('en-IN')} has been confirmed. (Simulated payment)`)
  appendAuditLog('FINANCIAL', `Merch order ${order.id} by ${u.name}: ₹${total}`)
  return order
}

// ---------- Order history ----------
export async function myOrders(): Promise<Order[]> {
  await wait()
  const u = requireUser()
  return loadOrders().filter((o) => o.userId === u.id)
}

export async function allOrders(): Promise<Order[]> {
  await wait()
  requireAdmin()
  return loadOrders()
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  await wait()
  requireAdmin()
  const orders = loadOrders()
  const o = orders.find((x) => x.id === orderId)
  if (!o) throw new ApiError('Order not found.', 404)
  if (status === 'CANCELLED' && o.status === 'CANCELLED') throw new ApiError('Order already cancelled.', 400)
  // Restore stock on cancel
  if (status === 'CANCELLED') {
    const products = loadProducts()
    for (const item of o.items) {
      const p = products.find((x) => x.id === item.productId)
      if (p) {
        const v = p.variants.find((x) => x.label === item.variantLabel)
        if (v) v.stock += item.qty
      }
    }
    saveProducts(products)
  }
  o.status = status
  saveOrders(orders)
  pushNotification(o.userId, 'Order updated', `Your order #${o.id} status changed to ${status}.`)
  appendAuditLog('ADMIN', `Order ${o.id} status → ${status}`)
  return o
}
