import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { notFound } from "next/navigation"
import { PermissionsForm } from "./PermissionsForm"
import Link from "next/link"

export default async function UserPermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Only admins can edit permissions
  await requireRole("ADMIN")

  // Fetch the user and their permissions
  const user = await prisma.user.findUnique({
    where: { id },
    include: { permission: true }
  })

  if (!user) notFound()

  // If no permission record exists, create one with defaults
  let permissions = user.permission
  if (!permissions) {
    permissions = await prisma.permission.create({
      data: {
        userId: user.id,
        canViewDashboard: true,
        canViewProducts: true,
        canViewCustomers: true,
        canViewSuppliers: true,
        canViewPurchaseOrders: true,
        canViewPriceOffers: true,
        canViewSalesOrders: true,
        canViewUsers: user.role === "ADMIN",
        canCreateProducts: user.role === "ADMIN",
        canEditProducts: user.role === "ADMIN",
        canDeleteProducts: user.role === "ADMIN",
        canAdjustStock: user.role === "ADMIN",
        canCreateCustomers: true,
        canEditCustomers: true,
        canCreateSuppliers: user.role === "ADMIN",
        canEditSuppliers: user.role === "ADMIN",
        canCreatePurchaseOrders: user.role === "ADMIN",
        canApprovePurchaseOrders: user.role === "ADMIN",
        canConfirmPurchaseOrders: user.role === "ADMIN",
        canCreatePriceOffers: true,
        canApprovePriceOffers: user.role === "ADMIN",
        canConvertPriceOffers: true,
        canCreateSalesOrders: user.role === "ADMIN",
        canConfirmSalesOrders: true,
        canCreateUsers: user.role === "ADMIN",
        canDeleteUsers: user.role === "ADMIN",
        canExportData: true,
      }
    })
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link href="/users" className="text-sm text-blue-600 hover:underline">
          ← Back to Users
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Permissions: {user.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Role: <span className="font-semibold">{user.role}</span> • Email: {user.email}
        </p>
      </div>

      <PermissionsForm
        userId={user.id}
        userName={user.name}
        userRole={user.role}
        userEmail={user.email}
        permissions={permissions}
      />
    </div>
  )
}