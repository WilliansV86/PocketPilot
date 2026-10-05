import { Prisma } from "@prisma/client";
import { authorizeOperation, assertResultOwnership } from "@/lib/ownership-policy";

const delegates = new Map(Prisma.dmmf.datamodel.models.map(model => [
  model.name[0].toLowerCase() + model.name.slice(1), model.name,
]));

// The raw transaction stays private. Every exposed model operation goes through
// the same ownership policy as ordinary queries, using transaction-local lookups.
export function scopedTransaction(raw: Prisma.TransactionClient, userId: string): Prisma.TransactionClient {
  const lookup = async (model: string, id: string, ownerId: string) => {
    const delegate = (raw as any)[model[0].toLowerCase() + model.slice(1)];
    return Boolean(await delegate.findFirst({
      where: model === "User" ? { id, AND: [{ id: ownerId }] } : { id, userId: ownerId },
      select: { id: true },
    }));
  };
  return new Proxy(raw, {
    get(target, property) {
      const model = typeof property === "string" ? delegates.get(property) : undefined;
      if (!model) throw new Error("UNSCOPED_OPERATION_DENIED");
      return new Proxy((target as any)[property], {
        get(delegate, action) {
          if (typeof action !== "string") throw new Error("UNSUPPORTED_OPERATION_DENIED");
          return async (originalArgs?: any) => {
            const args = await authorizeOperation(model, action, originalArgs, userId, lookup);
            const result = await delegate[action](args);
            assertResultOwnership(result, userId);
            return result;
          };
        },
      });
    },
  });
}
