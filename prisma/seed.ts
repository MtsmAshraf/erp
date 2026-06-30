import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hash } from "bcryptjs"

// Setup the adapter for Prisma 7.x
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  // Create or update ADMIN user
  const admin = await prisma.user.upsert({
    where: { email: "admin@erp.local" },
    update: {},
    create: {
      email: "admin@erp.local",
      name: "System Admin",
      password: await hash("Admin123!", 10),
      role: "ADMIN",
    },
  })

  // Create or update permissions for ADMIN (all permissions enabled)
  await prisma.permission.upsert({
    where: { userId: admin.id },
    update: {
      canViewDashboard: true,
      canViewProducts: true,
      canViewCustomers: true,
      canViewSuppliers: true,
      canViewPurchaseOrders: true,
      canViewPriceOffers: true,
      canViewSalesOrders: true,
      canViewUsers: true,
      canCreateProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      canAdjustStock: true,
      canCreateCustomers: true,
      canEditCustomers: true,
      canCreateSuppliers: true,
      canEditSuppliers: true,
      canCreatePurchaseOrders: true,
      canApprovePurchaseOrders: true,
      canConfirmPurchaseOrders: true,
      canCreatePriceOffers: true,
      canApprovePriceOffers: true,
      canConvertPriceOffers: true,
      canCreateSalesOrders: true,
      canConfirmSalesOrders: true,
      canCreateUsers: true,
      canDeleteUsers: true,
      canExportData: true,
    },
    create: {
      userId: admin.id,
      canViewDashboard: true,
      canViewProducts: true,
      canViewCustomers: true,
      canViewSuppliers: true,
      canViewPurchaseOrders: true,
      canViewPriceOffers: true,
      canViewSalesOrders: true,
      canViewUsers: true,
      canCreateProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      canAdjustStock: true,
      canCreateCustomers: true,
      canEditCustomers: true,
      canCreateSuppliers: true,
      canEditSuppliers: true,
      canCreatePurchaseOrders: true,
      canApprovePurchaseOrders: true,
      canConfirmPurchaseOrders: true,
      canCreatePriceOffers: true,
      canApprovePriceOffers: true,
      canConvertPriceOffers: true,
      canCreateSalesOrders: true,
      canConfirmSalesOrders: true,
      canCreateUsers: true,
      canDeleteUsers: true,
      canExportData: true,
    },
  })

  // Find all STAFF users and create basic permissions for them
  const staffUsers = await prisma.user.findMany({
    where: { role: "STAFF" },
  })

  for (const staff of staffUsers) {
    await prisma.permission.upsert({
      where: { userId: staff.id },
      update: {},
      create: {
        userId: staff.id,
        // STAFF default permissions (basic access)
        canViewDashboard: true,
        canViewProducts: true,
        canViewCustomers: true,
        canViewSuppliers: true,
        canViewPurchaseOrders: true,
        canViewPriceOffers: true,
        canViewSalesOrders: true,
        canViewUsers: false,
        canCreateProducts: false,
        canEditProducts: false,
        canDeleteProducts: false,
        canAdjustStock: false,
        canCreateCustomers: true,
        canEditCustomers: true,
        canCreateSuppliers: false,
        canEditSuppliers: false,
        canCreatePurchaseOrders: false,
        canApprovePurchaseOrders: false,
        canConfirmPurchaseOrders: false,
        canCreatePriceOffers: true,
        canApprovePriceOffers: false,
        canConvertPriceOffers: true,
        canCreateSalesOrders: false,
        canConfirmSalesOrders: true,
        canCreateUsers: false,
        canDeleteUsers: false,
        canExportData: true,
      },
    })
  }

  console.log("✅ Seed complete!")
  console.log(`   - Admin user: admin@erp.local / Admin123!`)
  console.log(`   - Created permissions for ${staffUsers.length} STAFF user(s)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })