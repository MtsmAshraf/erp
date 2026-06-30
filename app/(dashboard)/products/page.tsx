import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { Pagination } from "@/components/Pagination"
import { PAGE_SIZE } from "@/app/lib/pagination"
import Link from "next/link"
import { Search } from "lucide-react"
import { DeleteProductButton } from "./DeleteProductButton"
import { requirePermission } from "@/app/lib/auth-utils"

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await requirePermission("canViewProducts")
  const session = await requireRole("ADMIN", "STAFF")
  const isStaff = session.user.role === "STAFF"
  const isAdmin = session.user.role === "ADMIN"
  
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const searchQuery = (params.search as string) || ""


  const [products, totalItems] = await Promise.all([
    prisma.product.findMany({
      where: searchQuery
        ? {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { sku: { contains: searchQuery, mode: "insensitive" } },
          ],
        }
        : {},
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        sku: true,
        name: true,
        unit: true,
        currentStock: true,
        costPrice: true,
      },
    }),
    prisma.product.count({ where: searchQuery
        ? {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { sku: { contains: searchQuery, mode: "insensitive" } },
          ],
        }
        : {} }),
  ])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/products/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Product
        </Link>
      </div>

      <div className="mb-4">
        <form className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="search"
            defaultValue={searchQuery}
            placeholder="Search by name or SKU..."
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button type="submit" className="sr-only">Search</button>
        </form>
      </div>

      <div className="overflow-hidden rounded-t-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Stock</th>
              {!isStaff && (
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cost Price</th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {products.length === 0 ? (
              <tr>
                <td colSpan={isStaff ? 4 : 5} className="px-6 py-8 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{product.sku}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{product.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      product.currentStock > 10 ? "bg-green-100 text-green-800" : 
                      product.currentStock > 0 ? "bg-yellow-100 text-yellow-800" : 
                      "bg-red-100 text-red-800"
                    }`}>
                      {product.currentStock} {product.unit}
                    </span>
                  </td>
                  {!isStaff && (
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      ${product.costPrice.toNumber().toFixed(2)}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm space-x-3">
                    <Link href={`/products/${product.id}`} className="text-blue-600 hover:text-blue-900">
                      View
                    </Link>
                    {isAdmin && <DeleteProductButton productId={product.id} />}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <Pagination 
        totalItems={totalItems} 
        currentPage={currentPage} 
        baseUrl="/products" 
        searchQuery={searchQuery} 
      />
    </div>
  )
}