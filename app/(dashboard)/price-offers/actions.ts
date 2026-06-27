"use server"

import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createPriceOffer(formData: FormData) {
  const session = await requireRole("ADMIN", "STAFF")
  const customerId = formData.get("customerId") as string
  const notes = formData.get("notes") as string

  // Generate Offer Number (PO-0001 format)
  const count = await prisma.priceOffer.count()
  const offerNumber = `PO-${String(count + 1).padStart(4, '0')}`

  const offer = await prisma.priceOffer.create({
    data: {
      offerNumber,
      customerId,
      createdById: session.user.id,
      notes,
      status: "DRAFT",
      total: 0
    }
  })

  redirect(`/price-offers/${offer.id}`)
}

export async function addOfferItem(prevState: { error: string | null }, formData: FormData) {
  await requireRole("ADMIN", "STAFF")
  const priceOfferId = formData.get("priceOfferId") as string
  const productId = formData.get("productId") as string
  const quantity = parseInt(formData.get("quantity") as string)
  const unitPrice = parseFloat(formData.get("unitPrice") as string)

  if (!unitPrice || unitPrice <= 0) {
    return { error: "Unit price must be greater than 0" }
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    return { error: "Product not found" }
  }

  // VALIDATION: Check if requested quantity exceeds available stock
  if (quantity > product.currentStock) {
    return { 
      error: `Insufficient stock for ${product.name}. Available: ${product.currentStock} ${product.unit}, Requested: ${quantity}.`
    }
  }

  const lineTotal = unitPrice * quantity

  await prisma.$transaction(async (tx) => {
    await tx.priceOfferItem.create({
      data: {
        priceOfferId,
        productId,
        quantity,
        unitPrice,
        lineTotal
      }
    })

    await tx.priceOffer.update({
      where: { id: priceOfferId },
      data: {
        total: { increment: lineTotal }
      }
    })
  })

  revalidatePath(`/price-offers/${priceOfferId}`)
  redirect(`/price-offers/${priceOfferId}`)
}

export async function removeOfferItem(formData: FormData) {
  await requireRole("ADMIN", "STAFF")
  const itemId = formData.get("itemId") as string
  const priceOfferId = formData.get("priceOfferId") as string

  const item = await prisma.priceOfferItem.findUnique({ where: { id: itemId } })
  if (!item) return

  await prisma.$transaction(async (tx) => {
    await tx.priceOfferItem.delete({ where: { id: itemId } })
    
    await tx.priceOffer.update({
      where: { id: priceOfferId },
      data: {
        total: { decrement: item.lineTotal.toNumber() }
      }
    })
  })

  revalidatePath(`/price-offers/${priceOfferId}`)
}

export async function submitForApproval(formData: FormData) {
  await requireRole("ADMIN", "STAFF")
  const priceOfferId = formData.get("priceOfferId") as string

  const offer = await prisma.priceOffer.findUnique({ where: { id: priceOfferId } })
  if (!offer || offer.status !== "DRAFT") throw new Error("Invalid offer")
  if (offer.total.toNumber() <= 0) throw new Error("Cannot submit an empty offer")

  await prisma.priceOffer.update({
    where: { id: priceOfferId },
    data: { status: "PENDING_APPROVAL" }
  })

  revalidatePath(`/price-offers/${priceOfferId}`)
  revalidatePath("/price-offers")
}

export async function approveOffer(formData: FormData) {
  const session = await requireRole("ADMIN") // ADMIN ONLY
  const priceOfferId = formData.get("priceOfferId") as string

  const offer = await prisma.priceOffer.findUnique({ where: { id: priceOfferId } })
  if (!offer || offer.status !== "PENDING_APPROVAL") throw new Error("Invalid offer")

  await prisma.priceOffer.update({
    where: { id: priceOfferId },
    data: { 
      status: "APPROVED",
      approvedById: session.user.id
    }
  })

  revalidatePath(`/price-offers/${priceOfferId}`)
  revalidatePath("/price-offers")
}

export async function rejectOffer(formData: FormData) {
  const session = await requireRole("ADMIN") // ADMIN ONLY
  const priceOfferId = formData.get("priceOfferId") as string

  const offer = await prisma.priceOffer.findUnique({ where: { id: priceOfferId } })
  if (!offer || offer.status !== "PENDING_APPROVAL") throw new Error("Invalid offer")

  await prisma.priceOffer.update({
    where: { id: priceOfferId },
    data: { 
      status: "REJECTED",
      approvedById: session.user.id
    }
  })

  revalidatePath(`/price-offers/${priceOfferId}`)
  revalidatePath("/price-offers")
}

export async function convertToSalesOrder(formData: FormData) {
  const session = await requireRole("ADMIN", "STAFF")
  const priceOfferId = formData.get("priceOfferId") as string

  const offer = await prisma.priceOffer.findUnique({
    where: { id: priceOfferId },
    include: { items: true }
  })

  if (!offer || offer.status !== "APPROVED") throw new Error("Offer must be approved first")

  // STAFF can only convert their own offers
  if (session.user.role === "STAFF" && offer.createdById !== session.user.id) {
    throw new Error("You can only convert your own offers")
  }

  // Generate Sales Order number
  const orderCount = await prisma.salesOrder.count()
  const orderNumber = `SO-${String(orderCount + 1).padStart(4, '0')}`

  await prisma.$transaction(async (tx) => {
    // 1. Create the Sales Order linked to the offer
    const salesOrder = await tx.salesOrder.create({
      data: {
        orderNumber,
        customerId: offer.customerId,
        createdById: session.user.id,
        status: "DRAFT",
        total: offer.total,
        convertedFromOfferId: offer.id // LINK BACK TO THE OFFER
      }
    })

    // 2. Copy all items from the offer to the sales order
    for (const item of offer.items) {
      await tx.orderItem.create({
        data: {
          salesOrderId: salesOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal
        }
      })
    }

    // 3. Mark the offer as converted
    await tx.priceOffer.update({
      where: { id: priceOfferId },
      data: { 
        status: "CONVERTED_TO_ORDER",
        convertedOrderNumber: orderNumber
      }
    })
  })

  revalidatePath(`/price-offers/${priceOfferId}`)
  revalidatePath("/sales-orders")
  redirect(`/sales-orders`)
}