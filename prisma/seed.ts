import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";


// 1. Setup the adapter
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
// 2. Pass it to the client
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await hash("Admin123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@erp.local" },
    update: {},
    create: {
      email: "admin@erp.local",
      name: "System Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("✅ Seed complete: Created admin@erp.local / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });