import { Prisma } from "@prisma/client";

type Lookup = (model: string, id: string, userId: string) => Promise<boolean>;
const models = new Map(Prisma.dmmf.datamodel.models.map(model => [model.name, model]));
const reads = new Set(["findMany", "findFirst", "findFirstOrThrow", "findUnique", "findUniqueOrThrow", "count", "aggregate", "groupBy"]);
const writes = new Set(["create", "createMany", "update", "updateMany", "delete", "deleteMany", "upsert"]);
function owned(model: string) {
  return model === "User" || models.get(model)?.fields.some(field => field.name === "userId" && field.kind === "scalar");
}
function scope(model: string, userId: string) { return model === "User" ? { id: userId } : { userId }; }
function whereFor(model: string, where: any, userId: string, unique: boolean) {
  // Keep the unique selector at the top level (Prisma >=5 supports additional
  // filters). AND retains caller predicates without permitting an OR bypass.
  return unique
    ? { ...where, AND: [...(Array.isArray(where?.AND) ? where.AND : where?.AND ? [where.AND] : []), scope(model, userId)] }
    : { AND: [where ?? {}, scope(model, userId)] };
}
function secureSelection(model: string, args: any, userId: string) {
  const fields = models.get(model)?.fields ?? [];
  if (args.select && model !== "User") args.select = { ...args.select, userId: true };
  for (const key of ["select", "include"]) {
    if (!args[key]) continue;
    const selection = { ...args[key] };
    for (const field of fields.filter(field => field.kind === "object")) {
      const requested = selection[field.name];
      if (!requested || !owned(field.type)) continue;
      const nested: any = requested === true ? {} : { ...requested };
      if (field.isList) nested.where = whereFor(field.type, nested.where, userId, false);
      secureSelection(field.type, nested, userId);
      selection[field.name] = nested;
    }
    if (selection._count === true) {
      selection._count = { select: Object.fromEntries(fields.filter(field => field.kind === "object" && field.isList).map(field => [field.name, true])) };
    }
    if (selection._count && typeof selection._count === "object" && selection._count.select) {
      const counts = { ...selection._count.select };
      for (const field of fields.filter(field => field.kind === "object" && field.isList && owned(field.type))) {
        if (counts[field.name]) {
          const count = counts[field.name] === true ? {} : { ...counts[field.name] };
          counts[field.name] = { ...count, where: whereFor(field.type, count.where, userId, false) };
        }
      }
      selection._count = { ...selection._count, select: counts };
    }
    args[key] = selection;
  }
}
async function secureData(model: string, data: any, userId: string, lookup: Lookup, creating: boolean) {
  if (!data || typeof data !== "object") throw new Error("INVALID_WRITE");
  if (data.userId !== undefined && data.userId !== userId) throw new Error("OWNER_CHANGE_DENIED");
  const fields = models.get(model)?.fields ?? [];
  // Nested relation writes require their own authorization policy. None of the
  // existing finance actions need them, so reject them rather than bypass guards.
  for (const field of fields.filter(field => field.kind === "object")) {
    if (data[field.name] !== undefined) throw new Error("NESTED_WRITE_DENIED");
    if (!owned(field.type)) continue;
    for (const foreignKey of field.relationFromFields ?? []) {
      const id = data[foreignKey];
      if (id === undefined || id === null) continue;
      if (typeof id !== "string" || !await lookup(field.type, id, userId)) {
        throw new Error("RELATED_RECORD_NOT_FOUND");
      }
    }
  }
  return creating ? { ...data, userId } : data;
}
export async function authorizeOperation(model: string | undefined, action: string, originalArgs: any, userId: string, lookup: Lookup) {
  if (!userId) throw new Error("AUTHENTICATION_REQUIRED");
  if (!model || !owned(model)) throw new Error("UNSCOPED_OPERATION_DENIED");
  if (!reads.has(action) && !writes.has(action)) throw new Error("UNSUPPORTED_OPERATION_DENIED");
  if (model === "User" && writes.has(action)) throw new Error("USER_WRITE_DENIED");
  const args = { ...(originalArgs ?? {}) };
  if (action !== "create" && action !== "createMany") {
    args.where = whereFor(model, args.where, userId,
      ["findUnique", "findUniqueOrThrow", "update", "delete", "upsert"].includes(action));
  }
  if (action === "create" || action === "update" || action === "updateMany") {
    args.data = await secureData(model, args.data, userId, lookup, action === "create");
  }
  if (action === "createMany") {
    const rows = Array.isArray(args.data) ? args.data : [args.data];
    args.data = await Promise.all(rows.map((row: any) => secureData(model, row, userId, lookup, true)));
  }
  if (action === "upsert") {
    args.create = await secureData(model, args.create, userId, lookup, true);
    args.update = await secureData(model, args.update, userId, lookup, false);
  }
  // Aggregate/groupBy projections are not model records.
  if (!["count", "aggregate", "groupBy", "createMany", "updateMany", "deleteMany"].includes(action)) {
    secureSelection(model, args, userId);
  }
  return args;
}
// Detect an inconsistent historical relation instead of returning another
// owner's nested data. Projections receive userId in secureSelection above.
export function assertResultOwnership(result: any, userId: string): void {
  if (Array.isArray(result)) { result.forEach(item => assertResultOwnership(item, userId)); return; }
  if (!result || typeof result !== "object" || result instanceof Date || result instanceof Prisma.Decimal) return;
  if (typeof result.userId === "string" && result.userId !== userId) throw new Error("RELATED_OWNER_MISMATCH");
  for (const value of Object.values(result)) assertResultOwnership(value, userId);
}
