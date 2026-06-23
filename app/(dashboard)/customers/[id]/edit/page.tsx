import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { notFound } from "next/navigation"
import { updateCustomer } from "../../actions"
import Link from "next/link"

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireRole("ADMIN", "STAFF")

  const customer = await prisma.customer.findUnique({
    where: { id },
  })

  if (!customer) notFound()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href={`/customers/${customer.id}`} className="text-sm text-blue-600 hover:underline">
          ← Back to Customer Details
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Customer</h1>
        <p className="mt-1 text-sm text-gray-500">Update information for {customer.name}</p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form action={updateCustomer} className="space-y-6">
          <input type="hidden" name="customerId" value={customer.id} />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name / Company *</label>
            <input 
              name="name" 
              required 
              defaultValue={customer.name}
              className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input 
                name="email" 
                type="email" 
                defaultValue={customer.email || ""}
                className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <input 
                name="phone" 
                defaultValue={customer.phone || ""}
                className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Sale Percentage (Markup %)
              <span className="ml-1 text-xs text-gray-500">e.g., 20 = 20% markup on cost price</span>
            </label>
            <input 
              name="salePercentage" 
              type="number" 
              step="0.01" 
              min="0" 
              defaultValue={customer.salePercentage.toNumber()}
              className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
            <textarea 
              name="address" 
              rows={3} 
              defaultValue={customer.address || ""}
              className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Link 
              href={`/customers/${customer.id}`}
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}