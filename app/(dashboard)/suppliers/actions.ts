"use server"

import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createSupplier(formData: FormData) {
  await requireRole("ADMIN", "STAFF")
  
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string

  await prisma.supplier.create({
    data: { name, email, phone, address }
  })

  revalidatePath("/suppliers")
  redirect("/suppliers")
}

export async function updateSupplier(formData: FormData) {
  await requireRole("ADMIN", "STAFF")
  
  const supplierId = formData.get("supplierId") as string
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string

  await prisma.supplier.update({
    where: { id: supplierId },
    data: { name, email, phone, address }
  })

  revalidatePath(`/suppliers/${supplierId}`)
  revalidatePath("/suppliers")
  redirect(`/suppliers/${supplierId}`)
}

export async function deleteSupplier(formData: FormData) {
  await requireRole("ADMIN")
  const supplierId = formData.get("supplierId") as string

  const poCount = await prisma.purchaseOrder.count({ where: { supplierId } })
  if (poCount > 0) {
    throw new Error(`Cannot delete this supplier. They have ${poCount} purchase order(s).`)
  }

  await prisma.supplier.delete({ where: { id: supplierId } })
  revalidatePath("/suppliers")
}