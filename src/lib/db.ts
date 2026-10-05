import "server-only";
import { PrismaClient } from "@prisma/client";
import { scopedTransaction } from "@/lib/scoped-transaction";
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
const client = shared.pocketpilotScopedPrisma ?? createScopedClient();
if (process.env.NODE_ENV !== "production") shared.pocketpilotScopedPrisma = client;
export const prisma = new Proxy(client, {
  get(target, property, receiver) {
    if (property === "$transaction") {
      return async (input: any, options?: any) => {
        // Batch transactions keep the existing middleware. Interactive writes
        // need relation lookups on their own connection, including uncommitted rows.
        if (typeof input !== "function") return target.$transaction(input, options);
        const user = await getCurrentUser();
        return servicePrisma.$transaction(tx => input(scopedTransaction(tx, user.id)), options);
      };
    }
    return Reflect.get(target, property, receiver);
  },
});
