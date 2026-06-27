import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Mail, Phone, MapPin, ShoppingCart } from "lucide-react"

export default async function SupplierDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireRole("ADMIN", "STAFF")

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })

  if (!supplier) notFound()

  const totalSpent = supplier.purchaseOrders
    .filter(po => po.status === "CONFIRMED")
    .reduce((sum, po) => sum + po.total.toNumber(), 0)

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <Link href="/suppliers" className="text-sm text-blue-600 hover:underline">
          ← Back to Suppliers
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
          <Link
            href={`/suppliers/${supplier.id}/edit`}
            className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
          >
            Edit Supplier
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail size={16} />
            <span>Email</span>
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900 break-all">
            {supplier.email || "—"}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone size={16} />
            <span>Phone</span>
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {supplier.phone || "—"}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Spent (Confirmed)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalSpent.toFixed(2)} EGP</p>
          <p className="text-xs text-gray-500 mt-1">{supplier.purchaseOrders.length} purchase order(s)</p>
        </div>
      </div>

      {supplier.address && (
        <div className="mb-8 rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <MapPin size={16} />
            <span>Address</span>
          </div>
          <p className="text-gray-900 whitespace-pre-line">{supplier.address}</p>
        </div>
      )}

      <section className="rounded-lg border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Purchase Orders</h2>
          </div>
          <Link
            href={`/purchase-orders/new?supplierId=${supplier.id}`}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New PO
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">PO #</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {supplier.purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    No purchase orders for this supplier yet.
                  </td>
                </tr>
              ) : (
                supplier.purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-gray-900">{po.poNumber}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{po.createdAt.toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{po.total.toNumber().toFixed(2)} EGP</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        po.status === "DRAFT" ? "bg-gray-100 text-gray-800" : 
                        po.status === "CONFIRMED" ? "bg-green-100 text-green-800" : 
                        "bg-red-100 text-red-800"
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <Link href={`/purchase-orders/${po.id}`} className="text-blue-600 hover:text-blue-900">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}