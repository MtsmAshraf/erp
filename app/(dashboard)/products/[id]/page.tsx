import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { notFound } from "next/navigation"
import { adjustStock } from "../actions"
import Link from "next/link"

// FIX: Next.js 15 requires `params` to be typed as a Promise
export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // FIX: We must await the params object to get the actual ID
  const { id } = await params;

  const session = await requireRole("ADMIN", "STAFF")
  const isStaff = session.user.role === "STAFF"
  const isAdmin = session.user.role === "ADMIN"

  // Fetch product and its stock movements
  const product = await prisma.product.findUnique({
    where: { id: id }, // Now using the correctly awaited ID
    include: {
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 20, // Show last 20 movements
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
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{product.name} ({product.sku})</h1>
      </div>

      {/* Product Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Current Stock</p>
          <p className="text-2xl font-bold text-gray-900">{product.currentStock} {product.unit}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Sell Price</p>
          <p className="text-2xl font-bold text-gray-900">${product.sellPrice.toNumber().toFixed(2)}</p>
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
        {/* Stock Adjustment Form (Admin Only) */}
        {isAdmin && (
          <div className="lg:col-span-1">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Adjust Stock</h2>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <form action={adjustStock} className="space-y-4">
                <input type="hidden" name="productId" value={product.id} />
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Movement Type</label>
                  <select name="type" className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="STOCK_IN">Stock In (Purchase/Return)</option>
                    <option value="STOCK_OUT">Stock Out (Damage/Loss)</option>
                    <option value="ADJUSTMENT">Inventory Adjustment</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
                  <input name="quantity" type="number" min="1" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Reason</label>
                  <input name="reason" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. Quarterly audit" />
                </div>

                <button type="submit" className="w-full rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                  Apply Adjustment
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Stock Ledger / History */}
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