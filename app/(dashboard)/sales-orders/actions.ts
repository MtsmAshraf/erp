"use server"

import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function   createSalesOrder(formData: FormData) {
  const session = await requireRole("ADMIN", "STAFF")
  const customerId = formData.get("customerId") as string

  // Generate Order Number (Simple sequence based on current count)
  const count = await prisma.salesOrder.count()
  const orderNumber = `SO-${String(count + 1).padStart(4, '0')}`

  const order = await prisma.salesOrder.create({
    data: {
      orderNumber,
      customerId,
      createdById: session.user.id,
      status: "DRAFT",
      total: 0
    }
  })

  redirect(`/sales-orders/${order.id}`)
}

export async function addOrderItem(formData: FormData) {
  await requireRole("ADMIN", "STAFF")
  const salesOrderId = formData.get("salesOrderId") as string
  const productId = formData.get("productId") as string
  const quantity = parseInt(formData.get("quantity") as string)

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new Error("Product not found")

  const lineTotal = product.sellPrice.toNumber() * quantity

  await prisma.$transaction(async (tx) => {
    // 1. Add the line item
    await tx.orderItem.create({
      data: {
        salesOrderId,
        productId,
        quantity,
        unitPrice: product.sellPrice,
        lineTotal
      }
    })

    // 2. Update the order total
    await tx.salesOrder.update({
      where: { id: salesOrderId },
      data: {
        total: {
          increment: lineTotal
        }
      }
    })
  })

  revalidatePath(`/sales-orders/${salesOrderId}`)
}

export async function removeOrderItem(formData: FormData) {
  await requireRole("ADMIN", "STAFF")
  const itemId = formData.get("itemId") as string
  const salesOrderId = formData.get("salesOrderId") as string

  const item = await prisma.orderItem.findUnique({ where: { id: itemId } })
  if (!item) return

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.delete({ where: { id: itemId } })
    
    await tx.salesOrder.update({
      where: { id: salesOrderId },
      data: {
        total: {
          decrement: item.lineTotal.toNumber()
        }
      }
    })
  })

  revalidatePath(`/sales-orders/${salesOrderId}`)
}

export async function confirmOrder(formData: FormData) {
  await requireRole("ADMIN", "STAFF")
  const salesOrderId = formData.get("salesOrderId") as string

  const order = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: { items: { include: { product: true } } }
  })

  if (!order || order.status !== "DRAFT") throw new Error("Invalid order")

  // CRITICAL: Check stock availability for ALL items before doing anything
  for (const item of order.items) {
    if (item.product.currentStock < item.quantity) {
      throw new Error(`Insufficient stock for ${item.product.name}. Available: ${item.product.currentStock}, Requested: ${item.quantity}`)
    }
  }

  // If we pass the check, execute the atomic transaction
  await prisma.$transaction(async (tx) => {
    // 1. Update order status to CONFIRMED
    await tx.salesOrder.update({
      where: { id: salesOrderId },
      data: { status: "CONFIRMED" }
    })

    // 2. Create stock movements and decrement stock for each item
    for (const item of order.items) {
      // Create the immutable ledger entry
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "STOCK_OUT",
          quantity: item.quantity,
          reason: `Sold via ${order.orderNumber}`,
          relatedOrderId: salesOrderId // Links the stock drop directly to this order!
        }
      })

      // Decrement the cached stock level
      await tx.product.update({
        where: { id: item.productId },
        data: {
          currentStock: {
            decrement: item.quantity
          }
        }
      })
    }
  })

  revalidatePath(`/sales-orders/${salesOrderId}`)
  revalidatePath("/sales-orders")
  redirect(`/sales-orders/${salesOrderId}`)
}