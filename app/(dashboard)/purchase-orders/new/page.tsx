import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { createPurchaseOrder } from "../actions"
import Link from "next/link"

export default async function NewPurchaseOrderPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await requireRole("ADMIN", "STAFF")
  const params = await searchParams
  const preselectedSupplierId = (params.supplierId as string) || ""
  
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } })

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/purchase-orders" className="text-sm text-blue-600 hover:underline">
          ← Back to Purchase Orders
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Create New Purchase Order</h1>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form action={createPurchaseOrder} className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Select Supplier *</label>
            <select name="supplierId" required defaultValue={preselectedSupplierId} className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">Choose a supplier...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} {s.email ? `(${s.email})` : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea name="notes" rows={3} className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. Expected delivery date, special instructions..." />
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Link href="/purchase-orders" className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Create Draft PO
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}