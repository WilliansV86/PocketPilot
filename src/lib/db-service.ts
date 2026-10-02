import "server-only";
import { PrismaClient } from "@prisma/client";

// Unscoped service client: only identity provisioning and the authenticated
// scheduled reminder route may use this. App financial queries use lib/db.
const shared = globalThis as unknown as { pocketpilotServicePrisma?: PrismaClient };
export const servicePrisma = shared.pocketpilotServicePrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") shared.pocketpilotServicePrisma = servicePrisma;
