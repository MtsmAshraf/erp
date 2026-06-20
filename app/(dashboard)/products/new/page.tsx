import { requireRole } from "@/app/lib/auth-utils"
import { createProduct } from "../actions"
import Link from "next/link"

export default async function NewProductPage() {
  const session = await requireRole("ADMIN", "STAFF")
  const isStaff = session.user.role === "STAFF"

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/products" className="text-sm text-blue-600 hover:underline">
          ← Back to Products
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Create New Product</h1>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {/* The 'action' prop points directly to our Server Action */}
        <form action={createProduct} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">SKU *</label>
              <input name="sku" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. TSHIRT-BLK-M" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Unit *</label>
              <select name="unit" defaultValue="pcs" className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="box">Boxes (box)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Product Name *</label>
            <input name="name" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <input name="category" className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. Apparel" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Initial Stock Level</label>
              <input name="initialStock" type="number" min="0" defaultValue="0" className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" rows={3} className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Cost Price {isStaff && <span className="text-xs text-gray-400">(Admin only)</span>}
              </label>
              <input 
                name="costPrice" 
                type="number" 
                step="0.01" 
                min="0" 
                disabled={isStaff} 
                className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500" 
                placeholder="0.00" 
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Sell Price *</label>
              <input name="sellPrice" type="number" step="0.01" min="0" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="0.00" />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Link href="/products" className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}