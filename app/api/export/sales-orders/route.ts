import { prisma } from "@/app/lib/prisma"
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get search query from URL if provided
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || ""

  const where = search
    ? {
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {}

  const orders = await prisma.salesOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      createdBy: { select: { name: true } },
    },
  })

  // Build CSV content
  const headers = ["Order Number", "Customer", "Customer Email", "Date", "Status", "Total", "Created By"]
  
  const escapeCSV = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return ""
    const str = String(value)
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const rows = orders.map(order => [
    escapeCSV(order.orderNumber),
    escapeCSV(order.customer.name),
    escapeCSV(order.customer.email),
    escapeCSV(order.createdAt.toISOString().split("T")[0]),
    escapeCSV(order.status),
    escapeCSV(order.total.toNumber().toFixed(2)),
    escapeCSV(order.createdBy.name),
  ].join(","))

  const csvContent = [headers.join(","), ...rows].join("\n")
  
  // Add BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF"
  const fullContent = bom + csvContent

  return new NextResponse(fullContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sales-orders-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}