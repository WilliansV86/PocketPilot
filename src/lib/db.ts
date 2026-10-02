import "server-only";
import { PrismaClient } from "@prisma/client";
import { servicePrisma } from "@/lib/db-service";
import { getCurrentUser } from "@/lib/current-user";
import { authorizeOperation, assertResultOwnership } from "@/lib/ownership-policy";

const shared = globalThis as unknown as { pocketpilotScopedPrisma?: PrismaClient };
function createScopedClient() {
  const client = new PrismaClient();
  client.$use(async (params, next) => {
    const user = await getCurrentUser();
    params.args = await authorizeOperation(params.model, params.action, params.args, user.id,
      async (model, id, userId) => {
        const delegate = (servicePrisma as any)[model[0].toLowerCase() + model.slice(1)];
        return Boolean(await delegate.findFirst({
          where: model === "User" ? { id, AND: [{ id: userId }] } : { id, userId },
          select: { id: true },
        }));
      });
    const result = await next(params);
    assertResultOwnership(result, user.id);
    return result;
  });
  return client;
}
// Middleware runs for every model operation, including interactive transactions.
export const prisma = shared.pocketpilotScopedPrisma ?? createScopedClient();
if (process.env.NODE_ENV !== "production") shared.pocketpilotScopedPrisma = prisma;
