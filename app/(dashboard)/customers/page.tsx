import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import Link from "next/link"

export default async function CustomersPage() {
  await requireRole("ADMIN", "STAFF")
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" }
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <Link
          href="/customers/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Customer
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Sale %</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Added</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    <Link href={`/customers/${customer.id}`} className="text-blue-600 hover:text-blue-900">
                      {customer.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{customer.email || "-"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{customer.phone || "-"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{customer.salePercentage.toNumber()}%</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{customer.createdAt.toLocaleDateString()}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <Link href={`/customers/${customer.id}`} className="text-blue-600 hover:text-blue-900">
                      View Details
                    </Link>
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