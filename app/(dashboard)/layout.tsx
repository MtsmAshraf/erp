import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Package, Users, FileText, UserCog, LogOut } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const isAdmin = session.user.role === "ADMIN"

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-gray-300">
        <div className="flex h-16 items-center border-b border-gray-800 px-6">
          <span className="text-lg font-bold text-white">ERP System</span>
        </div>
        <nav className="mt-6 space-y-1 px-3">
          <SidebarLink href="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <SidebarLink href="/dashboard/products" icon={<Package size={20} />} label="Products" />
          <SidebarLink href="/dashboard/customers" icon={<Users size={20} />} label="Customers" />
          <SidebarLink href="/dashboard/sales-orders" icon={<FileText size={20} />} label="Sales Orders" />
          {isAdmin && (
            <SidebarLink href="/dashboard/users" icon={<UserCog size={20} />} label="User Management" />
          )}
        </nav>
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

function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition hover:bg-gray-800 hover:text-white"
    >
      {icon}
      {label}
    </Link>
  )
}