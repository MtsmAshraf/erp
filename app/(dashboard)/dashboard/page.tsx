import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import Link from "next/link"
import { Package, Users, FileText, AlertTriangle } from "lucide-react"

export default async function DashboardPage() {
  await requireRole("ADMIN", "STAFF")

  // 1. Fetch Analytics in parallel for performance
  const [
    totalProducts,
    totalCustomers,
    confirmedOrdersCount,
    totalRevenueResult,
    lowStockProducts,
    recentOrders
  ] = await Promise.all([
    prisma.product.count(),
    prisma.customer.count(),
    prisma.salesOrder.count({ where: { status: "CONFIRMED" } }),
    // Summing the total of all confirmed orders
    prisma.salesOrder.aggregate({
      _sum: { total: true },
      where: { status: "CONFIRMED" }
    }),
    // Products with stock <= 10
    prisma.product.findMany({
      where: { currentStock: { lte: 10 } },
      orderBy: { currentStock: "asc" },
      take: 5
    }),
    // The 5 most recent confirmed orders
    prisma.salesOrder.findMany({
      where: { status: "CONFIRMED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: true }
    })
  ])

  const totalRevenue = totalRevenueResult._sum.total?.toNumber() || 0

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard Overview</h1>

      {/* Stat Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={<FileText className="text-green-600" />} color="green" />
        <StatCard title="Confirmed Orders" value={confirmedOrdersCount.toString()} icon={<Package className="text-blue-600" />} color="blue" />
        <StatCard title="Total Products" value={totalProducts.toString()} icon={<Package className="text-purple-600" />} color="purple" />
        <StatCard title="Active Customers" value={totalCustomers.toString()} icon={<Users className="text-orange-600" />} color="orange" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Low Stock Alerts */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b p-4">
            <AlertTriangle className="text-red-500" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Low Stock Alerts (≤ 10)</h2>
          </div>
          <div className="divide-y">
            {lowStockProducts.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">All stock levels are healthy.</p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                    product.currentStock === 0 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {product.currentStock} {product.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b p-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Confirmed Orders</h2>
          </div>
          <div className="divide-y">
            {recentOrders.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">No confirmed orders yet.</p>
            ) : (
              recentOrders.map((order) => (
                <Link href={`/sales-orders/${order.id}`} key={order.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div>
                    <p className="font-bold text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.customer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.total.toNumber().toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{order.createdAt.toLocaleDateString()}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  const bgColors = {
    green: "bg-green-50",
    blue: "bg-blue-50",
    purple: "bg-purple-50",
    orange: "bg-orange-50",
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`rounded-full p-2 ${bgColors[color as keyof typeof bgColors]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}