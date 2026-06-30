import { prisma } from "@/app/lib/prisma"
import { requireRole, getUserPermissions } from "@/app/lib/auth-utils"
import Link from "next/link"
import { 
  Package, 
  Users, 
  FileText, 
  AlertTriangle, 
  Truck, 
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Wallet,
  Warehouse
} from "lucide-react"

export default async function DashboardPage() {
  const session = await requireRole("ADMIN", "STAFF")
  const isAdmin = session.user.role === "ADMIN"
  
  // Fetch user permissions
  const permissions = await getUserPermissions()

  // Fetch all analytics in parallel
  const [
    totalProducts,
    totalCustomers,
    totalSuppliers,
    confirmedSalesOrders,
    confirmedPurchaseOrders,
    totalRevenueResult,
    totalPurchasesResult,
    lowStockProducts,
    recentSalesOrders,
    recentPurchaseOrders,
    pendingOffersCount,
    pendingOffers,
    confirmedOrderItems,
    allProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.customer.count(),
    prisma.supplier.count(),
    prisma.salesOrder.count({ where: { status: "CONFIRMED" } }),
    prisma.purchaseOrder.count({ where: { status: "CONFIRMED" } }),
    prisma.salesOrder.aggregate({
      _sum: { total: true },
      where: { status: "CONFIRMED" },
    }),
    prisma.purchaseOrder.aggregate({
      _sum: { total: true },
      where: { status: "CONFIRMED" },
    }),
    prisma.product.findMany({
      where: { currentStock: { lte: 10 } },
      orderBy: { currentStock: "asc" },
      take: 5,
    }),
    prisma.salesOrder.findMany({
      where: { status: "CONFIRMED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: true },
    }),
    prisma.purchaseOrder.findMany({
      where: { status: "CONFIRMED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { supplier: true },
    }),
    prisma.priceOffer.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.priceOffer.findMany({
      where: { status: "PENDING_APPROVAL" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { 
        customer: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.orderItem.findMany({
      where: {
        salesOrder: { status: "CONFIRMED" },
      },
      include: {
        product: { select: { costPrice: true } },
      },
    }),
    prisma.product.findMany({
      select: { currentStock: true, costPrice: true },
    }),
  ])

  const totalRevenue = totalRevenueResult._sum.total?.toNumber() || 0
  const totalPurchases = totalPurchasesResult._sum.total?.toNumber() || 0

  const cogs = confirmedOrderItems.reduce((sum, item) => {
    return sum + item.quantity * item.product.costPrice.toNumber()
  }, 0)
  const grossProfit = totalRevenue - cogs
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const cashFlow = totalRevenue - totalPurchases
  const inventoryValue = allProducts.reduce((sum, p) => {
    return sum + (p.currentStock * p.costPrice.toNumber())
  }, 0)

  // Determine which sections to show based on permissions
  const showSalesMetrics = permissions?.canViewSalesOrders
  const showPurchaseMetrics = permissions?.canViewPurchaseOrders
  const showProductMetrics = permissions?.canViewProducts
  const showCustomerMetrics = permissions?.canViewCustomers
  const showSupplierMetrics = permissions?.canViewSuppliers
  const showPriceOfferMetrics = permissions?.canViewPriceOffers || permissions?.canApprovePriceOffers

  // Quick actions for STAFF (filtered by permissions)
  const quickActions = [
    { href: "/sales-orders/new", icon: FileText, label: "New Sales Order", color: "blue", permission: permissions?.canCreateSalesOrders },
    { href: "/price-offers/new", icon: FileText, label: "New Price Offer", color: "purple", permission: permissions?.canCreatePriceOffers },
    { href: "/purchase-orders/new", icon: ShoppingCart, label: "New Purchase Order", color: "green", permission: permissions?.canCreatePurchaseOrders },
    { href: "/customers/new", icon: Users, label: "Add Customer", color: "orange", permission: permissions?.canCreateCustomers },
  ].filter(action => action.permission)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {session.user.name}. Here's what's happening in your business.
        </p>
      </div>

      {/* Financial Overview */}
      {(showSalesMetrics || showPurchaseMetrics || showProductMetrics || showPriceOfferMetrics) && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Financial Overview
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {showSalesMetrics && (
              <FinancialStatCard
                title="Total Revenue"
                value={`$${totalRevenue.toFixed(2)}`}
                subtitle={`${confirmedSalesOrders} confirmed order${confirmedSalesOrders !== 1 ? "s" : ""}`}
                icon={<DollarSign className="text-green-600" size={20} />}
                bgColor="bg-green-50"
                iconBg="bg-green-100"
              />
            )}
            {showPurchaseMetrics && (
              <FinancialStatCard
                title="Total Purchases"
                value={`$${totalPurchases.toFixed(2)}`}
                subtitle={`${confirmedPurchaseOrders} confirmed PO${confirmedPurchaseOrders !== 1 ? "s" : ""}`}
                icon={<ShoppingCart className="text-blue-600" size={20} />}
                bgColor="bg-blue-50"
                iconBg="bg-blue-100"
              />
            )}
            {showProductMetrics && (
              <FinancialStatCard
                title="Inventory Value"
                value={`$${inventoryValue.toFixed(2)}`}
                subtitle="Goods sitting in stock"
                icon={<Warehouse className="text-amber-600" size={20} />}
                bgColor="bg-amber-50"
                iconBg="bg-amber-100"
              />
            )}
          </div>

          {/* Profit & Cash Flow Row */}
          {(showSalesMetrics || showPurchaseMetrics) && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {showSalesMetrics && (
                <FinancialStatCard
                  title="Gross Profit"
                  value={`$${grossProfit.toFixed(2)}`}
                  subtitle={`${profitMargin.toFixed(1)}% margin (Revenue − COGS)`}
                  icon={<TrendingUp className="text-purple-600" size={20} />}
                  bgColor="bg-purple-50"
                  iconBg="bg-purple-100"
                  valueColor={grossProfit >= 0 ? "text-purple-900" : "text-red-600"}
                />
              )}
              {showSalesMetrics && showPurchaseMetrics && (
                <FinancialStatCard
                  title="Cash Flow"
                  value={`$${cashFlow.toFixed(2)}`}
                  subtitle="Money in − Money out (Revenue − Purchases)"
                  icon={<Wallet className="text-teal-600" size={20} />}
                  bgColor="bg-teal-50"
                  iconBg="bg-teal-100"
                  valueColor={cashFlow >= 0 ? "text-teal-900" : "text-red-600"}
                />
              )}
            </div>
          )}

          {/* Pending Offers Card */}
          {showPriceOfferMetrics && isAdmin && (
            <div className="mt-4">
              <Link href="/price-offers" className="block">
                <div className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pending Offers</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{pendingOffersCount}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {pendingOffersCount === 0 ? "No pending approvals" : "Awaiting your review"}
                      </p>
                    </div>
                    <div className="rounded-full bg-yellow-100 p-3">
                      <Clock className="text-yellow-600" size={24} />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Entity Counts */}
      {(showProductMetrics || showCustomerMetrics || showSupplierMetrics) && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Business Entities
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {showProductMetrics && (
              <Link href="/products" className="block">
                <div className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">Total Products</p>
                    <div className="rounded-full bg-indigo-100 p-2">
                      <Package className="text-indigo-600" size={20} />
                    </div>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{totalProducts}</p>
                  <p className="mt-1 text-xs text-gray-500">In your catalog</p>
                </div>
              </Link>
            )}
            {showCustomerMetrics && (
              <Link href="/customers" className="block">
                <div className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">Total Customers</p>
                    <div className="rounded-full bg-orange-100 p-2">
                      <Users className="text-orange-600" size={20} />
                    </div>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{totalCustomers}</p>
                  <p className="mt-1 text-xs text-gray-500">Active accounts</p>
                </div>
              </Link>
            )}
            {showSupplierMetrics && (
              <Link href="/suppliers" className="block">
                <div className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">Total Suppliers</p>
                    <div className="rounded-full bg-teal-100 p-2">
                      <Truck className="text-teal-600" size={20} />
                    </div>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{totalSuppliers}</p>
                  <p className="mt-1 text-xs text-gray-500">Vendor partners</p>
                </div>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Action Items */}
      {(showProductMetrics || (showPriceOfferMetrics && isAdmin) || quickActions.length > 0) && (
        <section className="grid gap-8 lg:grid-cols-2">
          {/* Low Stock Alerts */}
          {showProductMetrics && (
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-red-500" size={20} />
                  <h2 className="text-lg font-bold text-gray-900">Low Stock Alerts</h2>
                </div>
                <Link href="/products" className="text-sm text-blue-600 hover:text-blue-900">
                  View All →
                </Link>
              </div>
              <div className="divide-y">
                {lowStockProducts.length === 0 ? (
                  <div className="p-6 text-center">
                    <CheckCircle2 className="mx-auto mb-2 text-green-500" size={32} />
                    <p className="text-sm text-gray-500">All stock levels are healthy.</p>
                  </div>
                ) : (
                  lowStockProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                        product.currentStock === 0
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {product.currentStock} {product.unit}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Pending Approvals (Admin) OR Quick Actions (Staff) */}
          {isAdmin && showPriceOfferMetrics ? (
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <Clock className="text-yellow-500" size={20} />
                  <h2 className="text-lg font-bold text-gray-900">Pending Approvals</h2>
                </div>
                <Link href="/price-offers" className="text-sm text-blue-600 hover:text-blue-900">
                  View All →
                </Link>
              </div>
              <div className="divide-y">
                {pendingOffers.length === 0 ? (
                  <div className="p-6 text-center">
                    <CheckCircle2 className="mx-auto mb-2 text-green-500" size={32} />
                    <p className="text-sm text-gray-500">No offers awaiting approval.</p>
                  </div>
                ) : (
                  pendingOffers.map((offer) => (
                    <Link
                      key={offer.id}
                      href={`/price-offers/${offer.id}`}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                    >
                      <div>
                        <p className="font-bold text-gray-900">{offer.offerNumber}</p>
                        <p className="text-xs text-gray-500">
                          {offer.customer.name} • by {offer.createdBy.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${offer.total.toNumber().toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {offer.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ) : quickActions.length > 0 ? (
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="border-b p-4">
                <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
              </div>
              <div className={`grid gap-3 p-4 ${quickActions.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className={`flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 text-center transition hover:border-${action.color}-500 hover:bg-${action.color}-50`}
                    >
                      <Icon className={`text-${action.color}-600`} size={24} />
                      <span className="text-sm font-medium text-gray-900">{action.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* Recent Activity */}
      {(showSalesMetrics || showPurchaseMetrics) && (
        <section className="grid gap-8 lg:grid-cols-2">
          {/* Recent Sales Orders */}
          {showSalesMetrics && (
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="text-green-600" size={20} />
                  <h2 className="text-lg font-bold text-gray-900">Recent Sales Orders</h2>
                </div>
                <Link href="/sales-orders" className="text-sm text-blue-600 hover:text-blue-900">
                  View All →
                </Link>
              </div>
              <div className="divide-y">
                {recentSalesOrders.length === 0 ? (
                  <p className="p-6 text-center text-sm text-gray-500">
                    No confirmed sales orders yet.
                  </p>
                ) : (
                  recentSalesOrders.map((order) => (
                    <Link
                      href={`/sales-orders/${order.id}`}
                      key={order.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                    >
                      <div>
                        <p className="font-bold text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.customer.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${order.total.toNumber().toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Recent Purchase Orders */}
          {showPurchaseMetrics && (
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-blue-600" size={20} />
                  <h2 className="text-lg font-bold text-gray-900">Recent Purchase Orders</h2>
                </div>
                <Link href="/purchase-orders" className="text-sm text-blue-600 hover:text-blue-900">
                  View All →
                </Link>
              </div>
              <div className="divide-y">
                {recentPurchaseOrders.length === 0 ? (
                  <p className="p-6 text-center text-sm text-gray-500">
                    No confirmed purchase orders yet.
                  </p>
                ) : (
                  recentPurchaseOrders.map((po) => (
                    <Link
                      href={`/purchase-orders/${po.id}`}
                      key={po.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                    >
                      <div>
                        <p className="font-bold text-gray-900">{po.poNumber}</p>
                        <p className="text-xs text-gray-500">{po.supplier.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${po.total.toNumber().toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {po.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function FinancialStatCard({
  title,
  value,
  subtitle,
  icon,
  bgColor,
  iconBg,
  valueColor = "text-gray-900",
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  bgColor: string
  iconBg: string
  valueColor?: string
}) {
  return (
    <div className={`rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md ${bgColor}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className={`rounded-full p-2 ${iconBg}`}>{icon}</div>
      </div>
      <p className={`mt-2 text-3xl font-bold ${valueColor}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    </div>
  )
}