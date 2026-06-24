import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import Link from "next/link"
import { DeleteSupplierButton } from "./DeleteSupplierButton"

export default async function SuppliersPage() {
  const session = await requireRole("ADMIN", "STAFF")
  const isAdmin = session.user.role === "ADMIN"

  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { purchaseOrders: true } } }
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <Link
          href="/suppliers/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Supplier
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">POs</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No suppliers found.
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    <Link href={`/suppliers/${supplier.id}`} className="text-blue-600 hover:text-blue-900">
                      {supplier.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{supplier.email || "-"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{supplier.phone || "-"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                      {supplier._count.purchaseOrders}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm space-x-3">
                    <Link href={`/suppliers/${supplier.id}`} className="text-blue-600 hover:text-blue-900">View</Link>
                    {isAdmin && <DeleteSupplierButton supplierId={supplier.id} />}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}