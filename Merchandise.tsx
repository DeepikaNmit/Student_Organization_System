import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShoppingBag, Plus, Minus, ShoppingCart } from 'lucide-react'
import { listProducts, getCart, addToCart, removeFromCart, checkout, myOrders } from '../api/merchandise'
import { errMsg, formatInr, formatDate } from '../lib/format'
import { Banner, Spinner, EmptyState } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export function MerchandisePage() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'CART' | 'ORDERS'>('CATALOG')

  const productsQ = useQuery({ queryKey: ['products'], queryFn: listProducts })
  const cartQ = useQuery({ queryKey: ['cart'], queryFn: getCart })
  const ordersQ = useQuery({ queryKey: ['myOrders'], queryFn: myOrders })

  const addMut = useMutation({
    mutationFn: ({ productId, variantId, qty }: { productId: string; variantId: string; qty: number }) => addToCart(productId, variantId, qty),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] })
    }
  })

  const removeMut = useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId: string }) => removeFromCart(productId, variantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] })
    }
  })

  const checkoutMut = useMutation({
    mutationFn: checkout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] })
      qc.invalidateQueries({ queryKey: ['myOrders'] })
      setActiveTab('ORDERS')
    }
  })

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Merchandise</h1>
          <p className="mt-1 text-sm text-navy/70">Buy official Clustro gear.</p>
        </div>
        <div className="flex gap-2">
          <button className={`px-4 py-2 text-sm font-semibold rounded-lg ${activeTab === 'CATALOG' ? 'bg-navy text-white' : 'bg-navy-50 text-navy hover:bg-navy-100'}`} onClick={() => setActiveTab('CATALOG')}>Catalog</button>
          <button className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 ${activeTab === 'CART' ? 'bg-navy text-white' : 'bg-navy-50 text-navy hover:bg-navy-100'}`} onClick={() => setActiveTab('CART')}>
            <ShoppingCart className="w-4 h-4" /> Cart {cartQ.data && cartQ.data.length > 0 && <span className="bg-cyan-clustro text-navy px-1.5 rounded-full text-xs">{cartQ.data.length}</span>}
          </button>
          <button className={`px-4 py-2 text-sm font-semibold rounded-lg ${activeTab === 'ORDERS' ? 'bg-navy text-white' : 'bg-navy-50 text-navy hover:bg-navy-100'}`} onClick={() => setActiveTab('ORDERS')}>Orders</button>
        </div>
      </div>

      {activeTab === 'CATALOG' && (
        <div>
          {productsQ.isLoading && <Spinner label="Loading catalog..." />}
          {productsQ.isError && <Banner tone="error">{errMsg(productsQ.error)}</Banner>}
          {productsQ.data && productsQ.data.length === 0 && <EmptyState title="No Products" hint="No merchandise available right now." />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productsQ.data?.map(p => (
              <div key={p.id} className="card p-4 flex flex-col">
                <h3 className="font-bold text-navy text-lg">{p.name}</h3>
                <p className="text-sm text-navy/70 mb-4">{p.description}</p>
                <div className="mt-auto">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {p.variants.map(v => (
                      <button 
                        key={v.id} 
                        onClick={() => addMut.mutate({ productId: p.id, variantId: v.id, qty: 1 })}
                        disabled={v.stock === 0 || addMut.isPending}
                        className="btn-secondary text-xs flex items-center gap-1"
                      >
                        {v.label} - {formatInr(v.priceInr)}
                        {v.stock === 0 ? ' (Out)' : ' +'}
                      </button>
                    ))}
                  </div>
                  {user?.role === 'MEMBER' && p.memberDiscount > 0 && <span className="text-xs font-semibold text-emerald-600">{p.memberDiscount}% Member Discount Applies</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'CART' && (
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-navy mb-4">Your Cart</h2>
          {cartQ.isLoading && <Spinner />}
          {cartQ.data?.length === 0 && <p className="text-navy/70">Cart is empty.</p>}
          {cartQ.data && cartQ.data.length > 0 && (
            <div className="space-y-4">
              {cartQ.data.map(c => {
                const p = productsQ.data?.find(x => x.id === c.productId)
                const v = p?.variants.find(x => x.id === c.variantId)
                if (!p || !v) return null
                return (
                  <div key={`${c.productId}-${c.variantId}`} className="flex justify-between items-center border-b border-navy/10 pb-2">
                    <div>
                      <p className="font-semibold text-navy">{p.name} <span className="text-navy/60">({v.label})</span></p>
                      <p className="text-sm text-navy/70">{formatInr(v.priceInr)} x {c.qty}</p>
                    </div>
                    <button className="text-red-500 text-sm hover:underline" onClick={() => removeMut.mutate({ productId: c.productId, variantId: c.variantId })}>Remove</button>
                  </div>
                )
              })}
              {checkoutMut.isError && <Banner tone="error">{errMsg(checkoutMut.error)}</Banner>}
              <button className="btn-primary w-full mt-4" onClick={() => checkoutMut.mutate()} disabled={checkoutMut.isPending}>
                Checkout
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ORDERS' && (
        <div>
           {ordersQ.isLoading && <Spinner />}
           {ordersQ.data?.length === 0 && <EmptyState title="No Orders" hint="You haven't placed any orders yet." />}
           <div className="space-y-4 max-w-2xl mx-auto">
             {ordersQ.data?.map(o => (
               <div key={o.id} className="card p-4">
                 <div className="flex justify-between items-center mb-2">
                   <span className="font-bold text-navy">Order #{o.id}</span>
                   <span className="text-sm font-semibold px-2 py-1 bg-navy-50 rounded text-navy">{o.status}</span>
                 </div>
                 <p className="text-sm text-navy/70 mb-2">Placed on {formatDate(o.createdAt)}</p>
                 <ul className="text-sm text-navy mb-4">
                   {o.items.map(i => (
                     <li key={`${i.productId}-${i.variantLabel}`}>• {i.qty}x {i.productName} ({i.variantLabel}) - {formatInr(i.unitPriceInr)}</li>
                   ))}
                 </ul>
                 <p className="font-bold text-navy text-right">Total: {formatInr(o.totalInr)}</p>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  )
}
