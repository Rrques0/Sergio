import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

const plans = [
  {
    key: "free",
    name: "Free",
    priceCents: 0,
    limitsJson: { estimatesPerMonth: 5, invoicesPerMonth: 5, users: 1 },
    featuresJson: { brandedPdfFooter: true }
  },
  {
    key: "pro",
    name: "Pro",
    priceCents: 2900,
    limitsJson: { estimatesPerMonth: null, invoicesPerMonth: null, users: 3 },
    featuresJson: { customers: true, expenses: true, pdfs: true, qrCodes: true, reports: true }
  },
  {
    key: "business",
    name: "Business",
    priceCents: 7900,
    limitsJson: { estimatesPerMonth: null, invoicesPerMonth: null, users: 10 },
    featuresJson: {
      crew: true,
      materials: true,
      photoReports: true,
      changeOrders: true,
      voiceToEstimate: true,
      accountantExport: true
    }
  }
];

async function main() {
  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { key: plan.key },
      create: plan,
      update: plan
    });
  }

  const operatorPassword = process.env.SEED_OPERATOR_PASSWORD ?? randomBytes(18).toString("base64url");
  const operatorTotpSecret = process.env.SEED_OPERATOR_TOTP_SECRET ?? randomBytes(24).toString("base64url");

  const operatorTenant = await prisma.tenant.upsert({
    where: { slug: "standard-automata-operator" },
    create: {
      name: "Standard Automata Operator",
      slug: "standard-automata-operator",
      defaultLocale: "en",
      planKey: "business"
    },
    update: {}
  });

  const operatorUser = await prisma.user.upsert({
    where: { email: "operator@standardautomata.local" },
    create: {
      email: "operator@standardautomata.local",
      name: "Standard Automata Admin",
      passwordHash: await hashPassword(operatorPassword),
      preferredLocale: "en",
      totpEnabled: true,
      totpSecretEncrypted: operatorTotpSecret
    },
    update: {
      totpEnabled: true
    }
  });

  await prisma.membership.upsert({
    where: {
      tenantId_userId: {
        tenantId: operatorTenant.id,
        userId: operatorUser.id
      }
    },
    create: {
      tenantId: operatorTenant.id,
      userId: operatorUser.id,
      role: "STANDARD_AUTOMATA_ADMIN"
    },
    update: {
      role: "STANDARD_AUTOMATA_ADMIN",
      status: "ACTIVE"
    }
  });

  await prisma.deploymentInstance.create({
    data: {
      tenantId: operatorTenant.id,
      environment: "local",
      version: "0.1.0",
      status: "healthy",
      healthJson: { database: "ok", redis: "not_checked" },
      lastHeartbeatAt: new Date()
    }
  });

  console.log("Seed complete.");
  if (!process.env.SEED_OPERATOR_PASSWORD) {
    console.log(`Generated operator password: ${operatorPassword}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
