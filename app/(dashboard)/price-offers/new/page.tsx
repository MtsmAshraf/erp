import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { createPriceOffer } from "../actions"
import Link from "next/link"

export default async function NewPriceOfferPage() {
  await requireRole("ADMIN", "STAFF")
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } })

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/price-offers" className="text-sm text-blue-600 hover:underline">
          ← Back to Price Offers
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Create New Price Offer</h1>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form action={createPriceOffer} className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Select Customer *</label>
            <select name="customerId" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">Choose a customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes / Terms (Optional)</label>
            <textarea name="notes" rows={3} className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. Valid for 30 days, delivery in 2 weeks..." />
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Link href="/price-offers" className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Create Draft Offer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}