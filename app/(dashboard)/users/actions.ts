"use server"

import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { hash } from "bcryptjs"

export async function createUser(formData: FormData) {
  // STRICTLY ADMIN ONLY
  await requireRole("ADMIN")
  
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as "ADMIN" | "STAFF"

  const hashedPassword = await hash(password, 10)

  try {
    await prisma.user.create({
      data: { name, email, password: hashedPassword, role }
    })
  } catch (error: any) {
    // Prisma throws P2002 if a unique constraint (like email) is violated
    if (error.code === 'P2002') {
      throw new Error("A user with this email already exists.")
    }
    throw error
  }

  revalidatePath("/users")
  redirect("/users")
}

export async function deleteUser(formData: FormData) {
  const session = await requireRole("ADMIN")
  const userId = formData.get("userId") as string

  // SAFEGUARD 1: Prevent admin from deleting themselves
  if (userId === session.user.id) {
    throw new Error("You cannot delete your own account.")
  }

  const userToDelete = await prisma.user.findUnique({ where: { id: userId } })
  
  // SAFEGUARD 2: Prevent deleting the LAST admin in the system
  if (userToDelete?.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } })
    if (adminCount <= 1) {
      throw new Error("Cannot delete the last Admin user. Promote another user to Admin first.")
    }
  }

  await prisma.user.delete({ where: { id: userId } })
  revalidatePath("/users")
}

export async function updateUserPermissions(
  prevState: { success: boolean; message: string } | null,
  formData: FormData
) {
  "use server"
  
  try {
    await requireRole("ADMIN")
    
    const targetUserId = formData.get("userId") as string

    // Extract all permission fields from form data
    const permissionData = {
      canViewDashboard: formData.get("canViewDashboard") === "on",
      canViewProducts: formData.get("canViewProducts") === "on",
      canViewCustomers: formData.get("canViewCustomers") === "on",
      canViewSuppliers: formData.get("canViewSuppliers") === "on",
      canViewPurchaseOrders: formData.get("canViewPurchaseOrders") === "on",
      canViewPriceOffers: formData.get("canViewPriceOffers") === "on",
      canViewSalesOrders: formData.get("canViewSalesOrders") === "on",
      canViewUsers: formData.get("canViewUsers") === "on",
      canCreateProducts: formData.get("canCreateProducts") === "on",
      canEditProducts: formData.get("canEditProducts") === "on",
      canDeleteProducts: formData.get("canDeleteProducts") === "on",
      canAdjustStock: formData.get("canAdjustStock") === "on",
      canCreateCustomers: formData.get("canCreateCustomers") === "on",
      canEditCustomers: formData.get("canEditCustomers") === "on",
      canCreateSuppliers: formData.get("canCreateSuppliers") === "on",
      canEditSuppliers: formData.get("canEditSuppliers") === "on",
      canCreatePurchaseOrders: formData.get("canCreatePurchaseOrders") === "on",
      canApprovePurchaseOrders: formData.get("canApprovePurchaseOrders") === "on",
      canConfirmPurchaseOrders: formData.get("canConfirmPurchaseOrders") === "on",
      canCreatePriceOffers: formData.get("canCreatePriceOffers") === "on",
      canApprovePriceOffers: formData.get("canApprovePriceOffers") === "on",
      canConvertPriceOffers: formData.get("canConvertPriceOffers") === "on",
      canCreateSalesOrders: formData.get("canCreateSalesOrders") === "on",
      canConfirmSalesOrders: formData.get("canConfirmSalesOrders") === "on",
      canCreateUsers: formData.get("canCreateUsers") === "on",
      canDeleteUsers: formData.get("canDeleteUsers") === "on",
      canExportData: formData.get("canExportData") === "on",
    }

    await prisma.permission.upsert({
      where: { userId: targetUserId },
      update: permissionData,
      create: {
        userId: targetUserId,
        ...permissionData,
      },
    })

    revalidatePath("/users")
    revalidatePath(`/users/${targetUserId}/permissions`)
    
    return { success: true, message: "Permissions saved successfully!" }
  } catch (error) {
    console.error("Error saving permissions:", error)
    return { success: false, message: "Failed to save permissions. Please try again." }
  }
}