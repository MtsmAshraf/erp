import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Mail, Phone, MapPin, FileText, Percent, Calendar } from "lucide-react"

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireRole("ADMIN", "STAFF")

  // Fetch customer with their orders and offers
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      priceOffers: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })

  if (!customer) notFound()

  // Calculate totals
  const totalRevenue = customer.orders
    .filter(o => o.status === "CONFIRMED")
    .reduce((sum, o) => sum + o.total.toNumber(), 0)
  
  const confirmedOrdersCount = customer.orders.filter(o => o.status === "CONFIRMED").length
  const pendingOffersCount = customer.priceOffers.filter(o => o.status === "PENDING_APPROVAL").length

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/customers" className="text-sm text-blue-600 hover:underline">
          ← Back to Customers
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <Link
            href={`/customers/${customer.id}/edit`}
            className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
          >
            Edit Customer
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail size={16} />
            <span>Email</span>
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900 break-all">
            {customer.email || "—"}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone size={16} />
            <span>Phone</span>
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {customer.phone || "—"}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Percent size={16} />
            <span>Sale Markup</span>
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {customer.salePercentage.toNumber()}%
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={16} />
            <span>Customer Since</span>
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {customer.createdAt.toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Address (if exists) */}
      {customer.address && (
        <div className="mb-8 rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <MapPin size={16} />
            <span>Address</span>
          </div>
          <p className="text-gray-900 whitespace-pre-line">{customer.address}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">Total Revenue (Confirmed)</p>
          <p className="mt-1 text-2xl font-bold text-green-900">${totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-green-700 mt-1">{confirmedOrdersCount} confirmed order{confirmedOrdersCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">{customer.orders.length}</p>
          <p className="text-xs text-blue-700 mt-1">All statuses</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">Pending Offers</p>
          <p className="mt-1 text-2xl font-bold text-yellow-900">{pendingOffersCount}</p>
          <p className="text-xs text-yellow-700 mt-1">Awaiting approval</p>
        </div>
      </div>

      {/* History Sections */}
      <div className="space-y-8">
        {/* Sales Orders History */}
        <section className="rounded-lg border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Sales Orders History</h2>
            </div>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
              {customer.orders.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Order #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customer.orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                      No sales orders for this customer yet.
                    </td>
                  </tr>
                ) : (
                  customer.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {order.createdAt.toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        ${order.total.toNumber().toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <Link href={`/sales-orders/${order.id}`} className="text-blue-600 hover:text-blue-900">
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

        {/* Price Offers History */}
        <section className="rounded-lg border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Price Offers History</h2>
            </div>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
              {customer.priceOffers.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Offer #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customer.priceOffers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                      No price offers for this customer yet.
                    </td>
                  </tr>
                ) : (
                  customer.priceOffers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-gray-900">
                        {offer.offerNumber}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {offer.createdAt.toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        ${offer.total.toNumber().toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <OfferStatusBadge status={offer.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <Link href={`/price-offers/${offer.id}`} className="text-blue-600 hover:text-blue-900">
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
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    CONFIRMED: "bg-green-100 text-green-800",
    FULFILLED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
  }
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  )
}

function OfferStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CONVERTED_TO_ORDER: "bg-blue-100 text-blue-800",
  }
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CONVERTED_TO_ORDER: "Converted",
  }
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {labels[status] || status}
    </span>
  )
}