import "server-only";
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { servicePrisma } from "@/lib/db-service";
import { starterCategoryRecords } from "@/lib/starter-categories";

// React cache is scoped to the current server request, never shared among users.
export const getCurrentUser = cache(async () => {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("AUTHENTICATION_REQUIRED");
  const links = await servicePrisma.$queryRaw<{ userId: string }[]>`
    SELECT "userId" FROM "AuthIdentity" WHERE "clerkUserId" = ${clerkUserId}
  `;
  if (links.length) {
    const user = await servicePrisma.user.findUnique({ where: { id: links[0].userId } });
    if (!user) throw new Error("ACCOUNT_LINK_INVALID");
    return user;
  }

  const identity = await currentUser();
  const email = identity?.emailAddresses.find(address => address.id === identity.primaryEmailAddressId);
  if (!identity || identity.id !== clerkUserId || !email || email.verification?.status !== "verified") {
    throw new Error("VERIFIED_EMAIL_REQUIRED");
  }
  // New accounts receive an independent row. Never attach records by matching
  // email, selecting the first user, or falling back to the legacy owner.
  // A Clerk ID is stable and unique; upsert also handles simultaneous requests.
  return servicePrisma.$transaction(async tx => {
    // Serialize first-time provisioning so simultaneous page requests cannot seed twice.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${clerkUserId}))::text`;
    const existed = await tx.user.findUnique({ where: { id: clerkUserId }, select: { id: true } });
    const user = await tx.user.upsert({
      where: { id: clerkUserId },
      create: {
        id: clerkUserId,
        email: `clerk-${clerkUserId}@identity.pocketpilot.invalid`,
        name: [identity.firstName, identity.lastName].filter(Boolean).join(" ") || "PocketPilot User",
      },
      update: {},
    });
    if (!existed) {
      await tx.category.createMany({ data: starterCategoryRecords(user.id) });
    }
    await tx.$executeRaw`
      INSERT INTO "AuthIdentity" ("clerkUserId", "userId")
      VALUES (${clerkUserId}, ${user.id}) ON CONFLICT ("clerkUserId") DO NOTHING
    `;
    const saved = await tx.$queryRaw<{ userId: string }[]>`
      SELECT "userId" FROM "AuthIdentity" WHERE "clerkUserId" = ${clerkUserId}
    `;
    if (saved.length !== 1 || saved[0].userId !== user.id) throw new Error("ACCOUNT_LINK_CONFLICT");
    return user;
  });
});
