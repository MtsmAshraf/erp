import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { notFound } from "next/navigation"
import { removePOItem, submitPOForApproval, approvePO, rejectPO, confirmPurchaseOrder } from "../actions"
import { AddPOItemForm } from "../AddPOItemForm"
import Link from "next/link"
import { serializeProduct } from "@/app/lib/utils"

export default async function PurchaseOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole("ADMIN", "STAFF")
  const isAdmin = session.user.role === "ADMIN"

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      items: {
        include: { product: true }
      }
    }
  })

  if (!po) notFound()

  const products = (await prisma.product.findMany({ orderBy: { name: "asc" } }))
  .map(product => serializeProduct(product))

  const isDraft = po.status === "DRAFT"
  const isPending = po.status === "PENDING_APPROVAL"
  const isApproved = po.status === "APPROVED"
  const isRejected = po.status === "REJECTED"
  const isConfirmed = po.status === "CONFIRMED"

  // Can edit only if DRAFT and (is admin OR is the creator)
  const canEdit = isDraft && (isAdmin || po.createdById === session.user.id)
  const canSubmit = isDraft && po.total.toNumber() > 0 && (isAdmin || po.createdById === session.user.id)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link href="/purchase-orders" className="text-sm text-blue-600 hover:underline">
          ← Back to Purchase Orders
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Purchase Order {po.poNumber}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
            po.status === "DRAFT" ? "bg-gray-100 text-gray-800" : 
            po.status === "PENDING_APPROVAL" ? "bg-yellow-100 text-yellow-800" : 
            po.status === "APPROVED" ? "bg-blue-100 text-blue-800" : 
            po.status === "REJECTED" ? "bg-red-100 text-red-800" : 
            po.status === "CONFIRMED" ? "bg-green-100 text-green-800" : 
            "bg-gray-100 text-gray-800"
          }`}>
            {po.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Approval Info */}
      {(isApproved || isRejected) && po.approvedBy && (
        <div className={`mb-6 rounded-lg border p-4 ${isApproved ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <p className={`font-medium ${isApproved ? "text-green-800" : "text-red-800"}`}>
            {isApproved ? "✓ Approved" : "✗ Rejected"} by {po.approvedBy.name}
          </p>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Supplier</p>
          <p className="text-lg font-semibold text-gray-900">
            <Link href={`/suppliers/${po.supplier.id}`} className="text-blue-600 hover:text-blue-900">
              {po.supplier.name}
            </Link>
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Created By</p>
          <p className="text-lg font-semibold text-gray-900">{po.createdBy.name}</p>
          <p className="text-xs text-gray-500">{po.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Cost</p>
          <p className="text-2xl font-bold text-gray-900">${po.total.toNumber().toFixed(2)}</p>
        </div>
      </div>

      {po.notes && (
        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-500">Notes</h3>
          <p className="text-gray-700 whitespace-pre-line">{po.notes}</p>
        </div>
      )}

      <div className="mb-8 rounded-lg border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-lg font-bold text-gray-900">Items</h2>
        </div>
        
        {canEdit && <AddPOItemForm purchaseOrderId={po.id} products={products} />}

        {isPending && !isAdmin && (
          <div className="border-b bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">⏳ Pending Approval:</span> This purchase order is awaiting admin approval. Editing is locked.
            </p>
          </div>
        )}

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Unit Cost</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Total</th>
              {canEdit && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {po.items.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 6 : 5} className="px-4 py-6 text-center text-sm text-gray-500">
                  No items added yet.
                </td>
              </tr>
            ) : (
              po.items.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{item.product.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{item.product.sku}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">${item.unitCost.toNumber().toFixed(2)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">${item.lineTotal.toNumber().toFixed(2)}</td>
                  {canEdit && (
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <form action={removePOItem}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="purchaseOrderId" value={po.id} />
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
        {/* Submit for Approval */}
        {canSubmit && (
          <form action={submitPOForApproval}>
            <input type="hidden" name="purchaseOrderId" value={po.id} />
            <button type="submit" className="rounded bg-yellow-600 px-6 py-3 text-sm font-medium text-white hover:bg-yellow-700 shadow-sm">
              Submit for Approval
            </button>
          </form>
        )}

        {/* Approve / Reject (Admin only, when pending) */}
        {isPending && isAdmin && (
          <>
            <form action={approvePO}>
              <input type="hidden" name="purchaseOrderId" value={po.id} />
              <button type="submit" className="rounded bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 shadow-sm">
                ✓ Approve PO
              </button>
            </form>
            <form action={rejectPO}>
              <input type="hidden" name="purchaseOrderId" value={po.id} />
              <button type="submit" className="rounded bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 shadow-sm">
                ✗ Reject PO
              </button>
            </form>
          </>
        )}

        {/* Confirm & Receive Stock (when approved) */}
        {isApproved && (
          <form action={confirmPurchaseOrder}>
            <input type="hidden" name="purchaseOrderId" value={po.id} />
            <button type="submit" className="rounded bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 shadow-sm">
              Confirm & Receive Stock
            </button>
          </form>
        )}
      </div>

      {/* Pending message for STAFF */}
      {isPending && !isAdmin && (
        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center text-yellow-800">
          This purchase order is pending admin approval. You will be able to confirm it once approved.
        </div>
      )}

      {isConfirmed && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-center text-green-800">
          ✓ This purchase order has been confirmed and stock has been received.
        </div>
      )}
    </div>
  )
}