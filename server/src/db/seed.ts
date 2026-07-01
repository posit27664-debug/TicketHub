import { prisma } from "./client";
import { Role } from "../generated/prisma/client";
import { hashPassword } from "@better-auth/utils/password";

async function seed() {
  console.log("🌱 Starting database seed...");

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "password123";

  // ─── Clean up existing users to avoid conflicts ────────────────────────────
  await prisma.user.deleteMany({
    where: {
      email: { in: [adminEmail, "agent@tickethub.com"] },
    },
  });

  // ─── Admin User ────────────────────────────────────────────────────────────
  const hashedAdmin = await hashPassword(adminPassword);
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin User",
      role: Role.ADMIN,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: crypto.randomUUID(),
          providerId: "credential",
          password: hashedAdmin,
        },
      },
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ─── Agent User ────────────────────────────────────────────────────────────
  const hashedAgent = await hashPassword("agent123");
  const agent = await prisma.user.create({
    data: {
      email: "agent@tickethub.com",
      name: "Support Agent",
      role: Role.AGENT,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: crypto.randomUUID(),
          providerId: "credential",
          password: hashedAgent,
        },
      },
    },
  });
  console.log(`✅ Agent user: ${agent.email}`);

  // ─── Knowledge Base ────────────────────────────────────────────────────────
  const knowledgeEntries = [
    {
      title: "Refund Policy",
      content:
        "Our refund policy allows full refunds within 30 days of purchase. After 30 days, partial refunds may be considered on a case-by-case basis. To request a refund, please provide your order ID and reason for the refund.",
      category: "REFUND_REQUEST" as const,
    },
    {
      title: "Technical Troubleshooting Guide",
      content:
        "For technical issues: 1) Clear your browser cache and cookies. 2) Try a different browser. 3) Disable browser extensions. 4) Check your internet connection. 5) If the issue persists, provide your browser version and operating system.",
      category: "TECHNICAL_QUESTION" as const,
    },
    {
      title: "Course Access FAQ",
      content:
        "Course access is available immediately after purchase. You can access your courses at learn.yourapp.com. If you cannot access your course, ensure you are logged in with the email used for purchase. Access is lifetime unless otherwise stated.",
      category: "GENERAL_QUESTION" as const,
    },
  ];

  for (const entry of knowledgeEntries) {
    await prisma.knowledgeBase.upsert({
      where: { id: entry.title },
      update: { content: entry.content },
      create: {
        title: entry.title,
        content: entry.content,
        category: entry.category,
      },
    });
  }
  console.log(`✅ Knowledge base seeded with ${knowledgeEntries.length} entries`);

  // ─── Sample Tickets ────────────────────────────────────────────────────────
  const sampleTickets = [
    {
      subject: "Cannot access my course after payment",
      body: "Hi, I purchased the JavaScript course yesterday but I still cannot access it. My order ID is ORD-12345. Please help!",
      fromName: "John Smith",
      fromEmail: "john.smith@example.com",
      category: "TECHNICAL_QUESTION" as const,
      assignedAgentId: agent.id,
    },
    {
      subject: "Refund request for React course",
      body: "I would like to request a refund for the React Advanced course I purchased 3 days ago. The content was not what I expected.",
      fromName: "Sarah Connor",
      fromEmail: "sarah.c@example.com",
      category: "REFUND_REQUEST" as const,
    },
    {
      subject: "Question about course certificate",
      body: "After completing the course, will I receive a certificate? And if so, how long does it take to receive it?",
      fromName: "Mike Johnson",
      fromEmail: "mike.j@example.com",
      category: "GENERAL_QUESTION" as const,
      assignedAgentId: agent.id,
    },
  ];

  for (const ticket of sampleTickets) {
    await prisma.ticket.create({ data: ticket });
  }
  console.log(`✅ Sample tickets seeded (${sampleTickets.length})`);

  console.log("\n🎉 Seed complete!");
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
  console.log("   Agent: agent@tickethub.com / agent123");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
