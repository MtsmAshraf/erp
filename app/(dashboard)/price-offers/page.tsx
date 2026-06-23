import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import Link from "next/link"

export default async function PriceOffersPage() {
  const session = await requireRole("ADMIN", "STAFF")
  const isAdmin = session.user.role === "ADMIN"

  // STAFF sees only their own offers, ADMIN sees all
  const where = isAdmin ? {} : { createdById: session.user.id }

  const offers = await prisma.priceOffer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { 
      customer: true,
      createdBy: { select: { name: true } }
    }
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: "bg-gray-100 text-gray-800",
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      CONVERTED_TO_ORDER: "bg-blue-100 text-blue-800",
    }
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Price Offers</h1>
        <Link
          href="/price-offers/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Offer
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Offer #</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created By</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {offers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No price offers found.
                </td>
              </tr>
            ) : (
              offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">{offer.offerNumber}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{offer.customer.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{offer.createdBy.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{offer.createdAt.toLocaleDateString()}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">${offer.total.toNumber().toFixed(2)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(offer.status)}`}>
                      {offer.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <Link href={`/price-offers/${offer.id}`} className="text-blue-600 hover:text-blue-900">
                      View
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