"use client"

import { useActionState } from "react"
import { addOrderItem } from "./actions"

interface Product {
  id: string
  name: string
  sku: string
  currentStock: number
  costPrice: any
}

export function AddOrderItemForm({ salesOrderId, products }: { salesOrderId: string; products: Product[] }) {
  const [state, formAction, isPending] = useActionState(addOrderItem, { error: "" })

  return (
    <div className="border-b bg-gray-50 p-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="salesOrderId" value={salesOrderId} />
        
        {state.error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-800">{state.error}</p>
          </div>
        )}

        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Product</label>
            <select name="productId" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">Select a product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) - Stock: {p.currentStock} - Cost: ${p.costPrice.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="mb-1 block text-sm font-medium text-gray-700">Qty</label>
            <input name="quantity" type="number" min="1" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div className="w-40">
            <label className="mb-1 block text-sm font-medium text-gray-700">Unit Price *</label>
            <input name="unitPrice" type="number" step="0.01" min="0.01" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="0.00" />
          </div>
          <button 
            type="submit" 
            disabled={isPending}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Adding..." : "Add Item"}
          </button>
        </div>
      </form>
    </div>
  )
}