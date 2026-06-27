"use server"

import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createPurchaseOrder(formData: FormData) {
  const session = await requireRole("ADMIN", "STAFF")
  const supplierId = formData.get("supplierId") as string
  const notes = formData.get("notes") as string

  const count = await prisma.purchaseOrder.count()
  const poNumber = `PO-${String(count + 1).padStart(4, '0')}`

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId,
      createdById: session.user.id,
      notes,
      status: "DRAFT",
      total: 0
    }
  })

  redirect(`/purchase-orders/${po.id}`)
}

export async function addPOItem(prevState: { error: string | null }, formData: FormData) {
  await requireRole("ADMIN", "STAFF")
  const purchaseOrderId = formData.get("purchaseOrderId") as string
  const productId = formData.get("productId") as string
  const quantity = parseInt(formData.get("quantity") as string)
  const unitCost = parseFloat(formData.get("unitCost") as string)

  if (!unitCost || unitCost <= 0) {
    return { error: "Unit cost must be greater than 0" }
  }
  if (!quantity || quantity <= 0) {
    return { error: "Quantity must be greater than 0" }
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    return { error: "Product not found" }
  }

  const lineTotal = unitCost * quantity

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrderItem.create({
      data: {
        purchaseOrderId,
        productId,
        quantity,
        unitCost,
        lineTotal
      }
    })

    await tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { total: { increment: lineTotal } }
    })
  })

  revalidatePath(`/purchase-orders/${purchaseOrderId}`)
  return { error: null }
}

export async function removePOItem(formData: FormData) {
  await requireRole("ADMIN", "STAFF")
  const itemId = formData.get("itemId") as string
  const purchaseOrderId = formData.get("purchaseOrderId") as string

  const item = await prisma.purchaseOrderItem.findUnique({ where: { id: itemId } })
  if (!item) return

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrderItem.delete({ where: { id: itemId } })
    
    await tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { total: { decrement: item.lineTotal.toNumber() } }
    })
  })

  revalidatePath(`/purchase-orders/${purchaseOrderId}`)
}

export async function submitPOForApproval(formData: FormData) {
  await requireRole("ADMIN", "STAFF")
  const purchaseOrderId = formData.get("purchaseOrderId") as string

  const po = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId } })
  if (!po || po.status !== "DRAFT") throw new Error("Invalid purchase order")
  if (po.total.toNumber() <= 0) throw new Error("Cannot submit an empty purchase order")

  await prisma.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { status: "PENDING_APPROVAL" }
  })

  revalidatePath(`/purchase-orders/${purchaseOrderId}`)
  revalidatePath("/purchase-orders")
}

export async function approvePO(formData: FormData) {
  const session = await requireRole("ADMIN") // ADMIN ONLY
  const purchaseOrderId = formData.get("purchaseOrderId") as string

  const po = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId } })
  if (!po || po.status !== "PENDING_APPROVAL") throw new Error("Invalid purchase order")

  await prisma.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { 
      status: "APPROVED",
      approvedById: session.user.id
    }
  })

  revalidatePath(`/purchase-orders/${purchaseOrderId}`)
  revalidatePath("/purchase-orders")
}

export async function rejectPO(formData: FormData) {
  const session = await requireRole("ADMIN") // ADMIN ONLY
  const purchaseOrderId = formData.get("purchaseOrderId") as string

  const po = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId } })
  if (!po || po.status !== "PENDING_APPROVAL") throw new Error("Invalid purchase order")

  await prisma.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { 
      status: "REJECTED",
      approvedById: session.user.id
    }
  })

  revalidatePath(`/purchase-orders/${purchaseOrderId}`)
  revalidatePath("/purchase-orders")
}

export async function confirmPurchaseOrder(formData: FormData) {
  await requireRole("ADMIN", "STAFF")
  const purchaseOrderId = formData.get("purchaseOrderId") as string

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { items: { include: { product: true } } }
  })

  if (!po || po.status !== "APPROVED") {
    throw new Error("Purchase order must be approved before confirming")
  }
  if (po.items.length === 0) throw new Error("Cannot confirm an empty purchase order")

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { status: "CONFIRMED" }
    })

    for (const item of po.items) {
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "STOCK_IN",
          quantity: item.quantity,
          reason: `Received via ${po.poNumber}`,
          relatedPurchaseOrderId: purchaseOrderId
        }
      })

      await tx.product.update({
        where: { id: item.productId },
        data: {
          currentStock: { increment: item.quantity }
        }
      })
    }
  })

  revalidatePath(`/purchase-orders/${purchaseOrderId}`)
  revalidatePath("/purchase-orders")
  revalidatePath("/products")
  redirect(`/purchase-orders/${purchaseOrderId}`)
}