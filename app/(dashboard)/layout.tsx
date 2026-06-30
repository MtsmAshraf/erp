import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { LayoutDashboard, Package, Users, FileText, UserCog, LogOut, Truck, ShoppingCart } from "lucide-react"
import { SidebarLink } from "./dashboard/SidebarLink"
import { getUserPermissions } from "@/app/lib/auth-utils"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  // Fetch user permissions
  const permissions = await getUserPermissions()

  // If no permission record exists, redirect to login
  // (This shouldn't happen if seed worked correctly, but it's a safety check)
  if (!permissions) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-64 flex-col bg-gray-900 text-gray-300">
        {/* Header */}
        <div className="flex h-16 items-center border-b border-gray-800 px-6">
          <span className="text-lg font-bold text-white">Smart Generation</span>
        </div>

        {/* Navigation - Filtered by permissions */}
        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto px-3">
          {permissions.canViewDashboard && (
            <SidebarLink href="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          )}
          {permissions.canViewProducts && (
            <SidebarLink href="/products" icon={<Package size={20} />} label="Products" />
          )}
          {permissions.canViewCustomers && (
            <SidebarLink href="/customers" icon={<Users size={20} />} label="Customers" />
          )}
          {permissions.canViewSuppliers && (
            <SidebarLink href="/suppliers" icon={<Truck size={20} />} label="Suppliers" />
          )}
          {permissions.canViewPurchaseOrders && (
            <SidebarLink href="/purchase-orders" icon={<ShoppingCart size={20} />} label="Purchase Orders" />
          )}
          {permissions.canViewPriceOffers && (
            <SidebarLink href="/price-offers" icon={<FileText size={20} />} label="Price Offers" />
          )}
          {permissions.canViewSalesOrders && (
            <SidebarLink href="/sales-orders" icon={<FileText size={20} />} label="Sales Orders" />
          )}
          {permissions.canViewUsers && (
            <SidebarLink href="/users" icon={<UserCog size={20} />} label="User Management" />
          )}
        </nav>

        {/* Footer / Copyright */}
        <div className="border-t border-gray-800 px-6 py-4 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Smart Generation
          </p>
          <p className="mt-1 text-xs text-gray-500">
            By:{" "}
            <a
              href="https://moatasimashraf.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-300 transition hover:text-white underline"
            >
              Moatasim
            </a>
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <h2 className="text-lg font-semibold text-gray-800">Welcome, {session.user.name}</h2>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button className="flex items-center gap-2 rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200">
              <LogOut size={16} />
              Logout
            </button>
          </form>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  )
}