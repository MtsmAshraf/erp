import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { notFound } from "next/navigation"
import { updateSupplier } from "../../actions"
import Link from "next/link"

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireRole("ADMIN", "STAFF")

  const supplier = await prisma.supplier.findUnique({ where: { id } })
  if (!supplier) notFound()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href={`/suppliers/${supplier.id}`} className="text-sm text-blue-600 hover:underline">
          ← Back to Supplier Details
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Supplier</h1>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form action={updateSupplier} className="space-y-6">
          <input type="hidden" name="supplierId" value={supplier.id} />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Supplier Name *</label>
            <input name="name" required defaultValue={supplier.name} className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input name="email" type="email" defaultValue={supplier.email || ""} className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <input name="phone" defaultValue={supplier.phone || ""} className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
            <textarea name="address" rows={3} defaultValue={supplier.address || ""} className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Link href={`/suppliers/${supplier.id}`} className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
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