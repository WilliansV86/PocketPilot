// Read-only integrity check. Prints counts, never balances or secrets.
const { Prisma, PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
const modelMap = new Map(Prisma.dmmf.datamodel.models.map(m => [m.name, m]));
function owns(m) { return m?.fields.some(f => f.name === 'userId' && f.kind === 'scalar'); }
function quote(name) { return '"' + name.replaceAll('"', '""') + '"'; }
async function main() {
  let mismatches = 0;
  let checked = 0;
  for (const model of modelMap.values()) {
    if (!owns(model)) continue;
    for (const field of model.fields) {
      const target = modelMap.get(field.type);
      if (field.kind !== 'object' || !owns(target) || field.relationFromFields?.length !== 1) continue;
      const foreignKey = field.relationFromFields[0];
      const sql = 'SELECT COUNT(*)::int AS count FROM ' + quote(model.name) + ' child JOIN ' + quote(target.name) + ' parent ON child.' + quote(foreignKey) + ' = parent."id" WHERE child."userId" <> parent."userId"';
      const rows = await db.$queryRawUnsafe(sql);
      const count = Number(rows[0]?.count || 0);
      console.log(model.name + '.' + foreignKey + ': ' + count + ' cross-user references');
      mismatches += count;
      checked++;
    }
  }
  const links = await db.$queryRaw`SELECT "clerkUserId", "userId" FROM "AuthIdentity"`;
  console.log('Identity mappings: ' + links.length);
  console.log(checked + ' financial relationships checked. No records were changed.');
  if (mismatches) {
    console.error('STOP: Existing cross-user references need review before publishing.');
    process.exitCode = 1;
  } else console.log('PASS: No cross-user financial references were found.');
}
main().catch(() => { console.error('The integrity check could not finish. No records were changed.'); process.exitCode = 1; }).finally(() => db.$disconnect());
