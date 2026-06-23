import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { notFound } from "next/navigation"
import { 
  addOfferItem, 
  removeOfferItem, 
  submitForApproval, 
  approveOffer, 
  rejectOffer, 
  convertToSalesOrder 
} from "../actions"
import Link from "next/link"

export default async function PriceOfferDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole("ADMIN", "STAFF")
  const isAdmin = session.user.role === "ADMIN"

  const offer = await (prisma as any).priceOffer.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      items: {
        include: { product: true }
      }
    }
  })

  if (!offer) notFound()

  const products = await (prisma as any).product.findMany({ orderBy: { name: "asc" } })

  const isDraft = offer.status === "DRAFT"
  const isPending = offer.status === "PENDING_APPROVAL"
  const isApproved = offer.status === "APPROVED"
  const isRejected = offer.status === "REJECTED"
  const isConverted = offer.status === "CONVERTED_TO_ORDER"

  // STAFF can only edit their own offers
  const canEdit = isDraft && (isAdmin || offer.createdById === session.user.id)
  // Only the creator or ADMIN can submit/convert
  const canSubmit = isDraft && offer.total.toNumber() > 0 && (isAdmin || offer.createdById === session.user.id)
  const canConvert = isApproved && (isAdmin || offer.createdById === session.user.id)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link href="/price-offers" className="text-sm text-blue-600 hover:underline">
          ← Back to Price Offers
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Offer {offer.offerNumber}</h1>
          <StatusBadge status={offer.status} />
        </div>
      </div>

      {/* Info Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Customer</p>
          <p className="text-lg font-semibold text-gray-900">{offer.customer.name}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Created By</p>
          <p className="text-lg font-semibold text-gray-900">{offer.createdBy.name}</p>
          <p className="text-xs text-gray-500">{offer.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">${offer.total.toNumber().toFixed(2)}</p>
        </div>
      </div>

      {/* Approval Info */}
      {(isApproved || isRejected) && offer.approvedBy && (
        <div className={`mb-6 rounded-lg border p-4 ${isApproved ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <p className={`font-medium ${isApproved ? "text-green-800" : "text-red-800"}`}>
            {isApproved ? "✓ Approved" : "✗ Rejected"} by {offer.approvedBy.name}
          </p>
        </div>
      )}

      {isConverted && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="font-medium text-blue-800">
            ✓ Converted to Sales Order: <Link href={`/sales-orders`} className="underline font-bold">{offer.convertedOrderNumber}</Link>
          </p>
        </div>
      )}

      {/* Notes */}
      {offer.notes && (
        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-500">Notes / Terms</h3>
          <p className="text-gray-700 whitespace-pre-line">{offer.notes}</p>
        </div>
      )}

      {/* Items Table */}
      <div className="mb-8 rounded-lg border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-lg font-bold text-gray-900">Offer Items</h2>
        </div>
        
        
        {canEdit && (
          <div className="border-b bg-gray-50 p-4">
            <form action={addOfferItem} className="flex items-end gap-4">
              <input type="hidden" name="priceOfferId" value={offer.id} />
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">Product</label>
                <select name="productId" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="">Select a product...</option>
                  {products.map((p: typeof products[number]) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Cost: ${p.costPrice.toNumber().toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="mb-1 block text-sm font-medium text-gray-700">Qty</label>
                <input name="quantity" type="number" min="1" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div className="w-40">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Unit Price *
                  <span className="ml-1 text-xs text-gray-500">(Customer markup: {offer.customer.salePercentage.toNumber()}%)</span>
                </label>
                <input name="unitPrice" type="number" step="0.01" min="0.01" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="0.00" />
              </div>
              <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Add Item
              </button>
            </form>
          </div>
        )}

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Unit Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Total</th>
              {canEdit && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {offer.items.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 6 : 5} className="px-4 py-6 text-center text-sm text-gray-500">
                  No items added yet.
                </td>
              </tr>
            ) : (
              offer.items.map((item: typeof offer.items[number]) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{item.product.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{item.product.sku}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">${item.unitPrice.toNumber().toFixed(2)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">${item.lineTotal.toNumber().toFixed(2)}</td>
                  {canEdit && (
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <form action={removeOfferItem}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="priceOfferId" value={offer.id} />
                        <button type="submit" className="text-red-600 hover:text-red-900">Remove</button>
                      </form>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Submit for Approval (STAFF/ADMIN, when draft) */}
        {canSubmit && (
          <form action={submitForApproval}>
            <input type="hidden" name="priceOfferId" value={offer.id} />
            <button type="submit" className="rounded bg-yellow-600 px-6 py-3 text-sm font-medium text-white hover:bg-yellow-700 shadow-sm">
              Submit for Approval
            </button>
          </form>
        )}

        {/* Approve / Reject (ADMIN only, when pending) */}
        {isPending && isAdmin && (
          <>
            <form action={approveOffer}>
              <input type="hidden" name="priceOfferId" value={offer.id} />
              <button type="submit" className="rounded bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 shadow-sm">
                ✓ Approve Offer
              </button>
            </form>
            <form action={rejectOffer}>
              <input type="hidden" name="priceOfferId" value={offer.id} />
              <button type="submit" className="rounded bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 shadow-sm">
                ✗ Reject Offer
              </button>
            </form>
          </>
        )}

        {/* Convert to Sales Order (when approved) */}
        {canConvert && (
          <form action={convertToSalesOrder}>
            <input type="hidden" name="priceOfferId" value={offer.id} />
            <button type="submit" className="rounded bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 shadow-sm">
              Convert to Sales Order →
            </button>
          </form>
        )}
      </div>

      {/* Pending message for STAFF */}
      {isPending && !isAdmin && (
        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center text-yellow-800">
          This offer is pending admin approval. You will be able to convert it to a sales order once approved.
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    DRAFT: "bg-gray-100 text-gray-800",
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CONVERTED_TO_ORDER: "bg-blue-100 text-blue-800",
  }
  const label = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CONVERTED_TO_ORDER: "Converted to Order",
  }
  
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${styles[status as keyof typeof styles]}`}>
      {label[status as keyof typeof label]}
    </span>
  )
}