import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { notFound } from "next/navigation"
import { DeleteProductButton } from "../DeleteProductButton"
import { StockAdjustmentForm } from "../StockAdjustmentForm"
import Link from "next/link"

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole("ADMIN", "STAFF")
  const isStaff = session.user.role === "STAFF"
  const isAdmin = session.user.role === "ADMIN"

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })

  if (!product) notFound()

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link href="/products" className="text-sm text-blue-600 hover:underline">
          ← Back to Products
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{product.name} ({product.sku})</h1>
          {isAdmin && <DeleteProductButton productId={product.id} />}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Current Stock</p>
          <p className="text-2xl font-bold text-gray-900">{product.currentStock} {product.unit}</p>
        </div>
        {!isStaff && (
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Cost Price</p>
            <p className="text-2xl font-bold text-gray-900">${product.costPrice.toNumber().toFixed(2)}</p>
          </div>
        )}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Category</p>
          <p className="text-lg font-semibold text-gray-900">{product.category || "Uncategorized"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {isAdmin && (
          <div className="lg:col-span-1">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Adjust Stock</h2>
            <StockAdjustmentForm productId={product.id} />
          </div>
        )}

        <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
          <h2 className="mb-4 text-lg font-bold text-gray-900">Stock Movement Ledger</h2>
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {product.stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  product.stockMovements.map((movement) => (
                    <tr key={movement.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {movement.createdAt.toLocaleDateString()} {movement.createdAt.toLocaleTimeString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          movement.type === "STOCK_IN" ? "bg-green-100 text-green-800" : 
                          movement.type === "STOCK_OUT" ? "bg-red-100 text-red-800" : 
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {movement.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {movement.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{movement.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}