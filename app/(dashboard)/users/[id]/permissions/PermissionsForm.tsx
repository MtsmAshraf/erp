"use client"

import { useActionState, useEffect, useState, useRef } from "react"
import { updateUserPermissions } from "../../actions"
import { PermissionToggle } from "../../PermissionToggle"
import Link from "next/link"
import { CheckCircle2, XCircle } from "lucide-react"

interface Permissions {
  canViewDashboard: boolean
  canViewProducts: boolean
  canViewCustomers: boolean
  canViewSuppliers: boolean
  canViewPurchaseOrders: boolean
  canViewPriceOffers: boolean
  canViewSalesOrders: boolean
  canViewUsers: boolean
  canCreateProducts: boolean
  canEditProducts: boolean
  canDeleteProducts: boolean
  canAdjustStock: boolean
  canCreateCustomers: boolean
  canEditCustomers: boolean
  canCreateSuppliers: boolean
  canEditSuppliers: boolean
  canCreatePurchaseOrders: boolean
  canApprovePurchaseOrders: boolean
  canConfirmPurchaseOrders: boolean
  canCreatePriceOffers: boolean
  canApprovePriceOffers: boolean
  canConvertPriceOffers: boolean
  canCreateSalesOrders: boolean
  canConfirmSalesOrders: boolean
  canCreateUsers: boolean
  canDeleteUsers: boolean
  canExportData: boolean
}

interface PermissionsFormProps {
  userId: string
  userName: string
  userRole: string
  userEmail: string
  permissions: Permissions
}

export function PermissionsForm({ userId, userName, userRole, userEmail, permissions }: PermissionsFormProps) {
  const [state, formAction, isPending] = useActionState(updateUserPermissions, null)
  const [showSuccess, setShowSuccess] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)

  // Show success message and scroll to top when state changes to success
  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true)
      // Scroll to top to show the banner
      window.scrollTo({ top: 0, behavior: "smooth" })
      // Auto-hide after 4 seconds
      const timer = setTimeout(() => setShowSuccess(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [state])

  return (
    <div className="relative">
      {/* Success/Error Banner - Fixed at top when showing */}
      {showSuccess && state?.success && (
        <div 
          ref={bannerRef}
          className="sticky top-4 z-50 mb-6 flex items-center gap-3 rounded-lg border-2 border-green-300 bg-green-50 p-4 shadow-lg transition-all duration-300"
          style={{ animation: "slideDown 0.3s ease-out" }}
        >
          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-base font-semibold text-green-900">Success!</p>
            <p className="text-sm text-green-700">{state.message}</p>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="text-green-600 hover:text-green-800 transition"
            aria-label="Close"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {state && !state.success && (
        <div className="sticky top-4 z-50 mb-6 flex items-center gap-3 rounded-lg border-2 border-red-300 bg-red-50 p-4 shadow-lg">
          <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-base font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700">{state.message}</p>
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-8">
        <input type="hidden" name="userId" value={userId} />

        {/* Page Access */}
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Page Access</h2>
          <p className="mb-4 text-sm text-gray-600">Control which pages this user can visit.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <PermissionToggle name="canViewDashboard" label="Dashboard" description="View the main dashboard" defaultChecked={permissions.canViewDashboard} />
            <PermissionToggle name="canViewProducts" label="Products" description="View product list and details" defaultChecked={permissions.canViewProducts} />
            <PermissionToggle name="canViewCustomers" label="Customers" description="View customer list and details" defaultChecked={permissions.canViewCustomers} />
            <PermissionToggle name="canViewSuppliers" label="Suppliers" description="View supplier list and details" defaultChecked={permissions.canViewSuppliers} />
            <PermissionToggle name="canViewPurchaseOrders" label="Purchase Orders" description="View purchase order list and details" defaultChecked={permissions.canViewPurchaseOrders} />
            <PermissionToggle name="canViewPriceOffers" label="Price Offers" description="View price offer list and details" defaultChecked={permissions.canViewPriceOffers} />
            <PermissionToggle name="canViewSalesOrders" label="Sales Orders" description="View sales order list and details" defaultChecked={permissions.canViewSalesOrders} />
            <PermissionToggle name="canViewUsers" label="User Management" description="View and manage other users" defaultChecked={permissions.canViewUsers} />
          </div>
        </section>

        {/* Product Actions */}
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Product Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <PermissionToggle name="canCreateProducts" label="Create Products" description="Add new products to the catalog" defaultChecked={permissions.canCreateProducts} />
            <PermissionToggle name="canEditProducts" label="Edit Products" description="Modify product details" defaultChecked={permissions.canEditProducts} />
            <PermissionToggle name="canDeleteProducts" label="Delete Products" description="Remove products from the catalog" defaultChecked={permissions.canDeleteProducts} />
            <PermissionToggle name="canAdjustStock" label="Adjust Stock" description="Manually adjust inventory levels" defaultChecked={permissions.canAdjustStock} />
          </div>
        </section>

        {/* Customer & Supplier Actions */}
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Customer & Supplier Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <PermissionToggle name="canCreateCustomers" label="Create Customers" description="Add new customers" defaultChecked={permissions.canCreateCustomers} />
            <PermissionToggle name="canEditCustomers" label="Edit Customers" description="Modify customer details" defaultChecked={permissions.canEditCustomers} />
            <PermissionToggle name="canCreateSuppliers" label="Create Suppliers" description="Add new suppliers" defaultChecked={permissions.canCreateSuppliers} />
            <PermissionToggle name="canEditSuppliers" label="Edit Suppliers" description="Modify supplier details" defaultChecked={permissions.canEditSuppliers} />
          </div>
        </section>

        {/* Purchase Order Actions */}
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Purchase Order Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <PermissionToggle name="canCreatePurchaseOrders" label="Create Purchase Orders" description="Create new purchase orders" defaultChecked={permissions.canCreatePurchaseOrders} />
            <PermissionToggle name="canApprovePurchaseOrders" label="Approve Purchase Orders" description="Approve or reject pending POs" defaultChecked={permissions.canApprovePurchaseOrders} />
            <PermissionToggle name="canConfirmPurchaseOrders" label="Confirm Purchase Orders" description="Receive stock from approved POs" defaultChecked={permissions.canConfirmPurchaseOrders} />
          </div>
        </section>

        {/* Price Offer Actions */}
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Price Offer Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <PermissionToggle name="canCreatePriceOffers" label="Create Price Offers" description="Create new price offers" defaultChecked={permissions.canCreatePriceOffers} />
            <PermissionToggle name="canApprovePriceOffers" label="Approve Price Offers" description="Approve or reject pending offers" defaultChecked={permissions.canApprovePriceOffers} />
            <PermissionToggle name="canConvertPriceOffers" label="Convert to Sales Orders" description="Convert approved offers to sales orders" defaultChecked={permissions.canConvertPriceOffers} />
          </div>
        </section>

        {/* Sales Order Actions */}
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Sales Order Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <PermissionToggle name="canCreateSalesOrders" label="Create Sales Orders" description="Create sales orders directly (without offers)" defaultChecked={permissions.canCreateSalesOrders} />
            <PermissionToggle name="canConfirmSalesOrders" label="Confirm Sales Orders" description="Confirm orders and deduct stock" defaultChecked={permissions.canConfirmSalesOrders} />
          </div>
        </section>

        {/* User Management Actions */}
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">User Management Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <PermissionToggle name="canCreateUsers" label="Create Users" description="Add new users to the system" defaultChecked={permissions.canCreateUsers} />
            <PermissionToggle name="canDeleteUsers" label="Delete Users" description="Remove users from the system" defaultChecked={permissions.canDeleteUsers} />
          </div>
        </section>

        {/* Export Actions */}
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Export Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <PermissionToggle name="canExportData" label="Export Data" description="Export sales orders to CSV" defaultChecked={permissions.canExportData} />
          </div>
        </section>

        <div className="flex justify-end gap-3 border-t pt-6">
          <Link href="/users" className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={isPending}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              "Save Permissions"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}