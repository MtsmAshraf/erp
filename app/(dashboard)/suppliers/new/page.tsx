import { requireRole } from "@/app/lib/auth-utils"
import { createSupplier } from "../actions"
import Link from "next/link"

export default async function NewSupplierPage() {
  await requireRole("ADMIN", "STAFF")

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/suppliers" className="text-sm text-blue-600 hover:underline">
          ← Back to Suppliers
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Add New Supplier</h1>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form action={createSupplier} className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Supplier Name *</label>
            <input name="name" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input name="email" type="email" className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <input name="phone" className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
            <textarea name="address" rows={3} className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Link href="/suppliers" className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Save Supplier
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}