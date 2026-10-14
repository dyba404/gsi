import "dotenv/config";
import pg from "pg";

// T-06 (plan §RLS.5): lint de migraciones. Toda tabla de negocio debe nacer con
// tenant_id NOT NULL + ENABLE/FORCE RLS + política. Las tablas de Better Auth son
// la excepción deliberada documentada (globales, protegidas por la capa de auth).

const AUTH_TABLES = new Set([
  "user",
  "session",
  "account",
  "verification",
  "organization",
  "member",
  "invitation",
]);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows: tables } = await client.query(`
  SELECT c.relname AS name, c.relrowsecurity AS rls, c.relforcerowsecurity AS force_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  ORDER BY 1`);

const { rows: tenantCols } = await client.query(`
  SELECT table_name, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name = 'tenant_id'`);
const tenantCol = new Map(tenantCols.map((r) => [r.table_name, r.is_nullable === "NO"]));

const { rows: policies } = await client.query(
  "SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'",
);
const hasPolicy = new Set(policies.map((r) => r.tablename));

const violations = [];
const business = [];
for (const t of tables) {
  if (AUTH_TABLES.has(t.name)) continue;
  business.push(t.name);
  if (!tenantCol.has(t.name)) violations.push(`${t.name}: no tiene columna tenant_id`);
  else if (tenantCol.get(t.name) === false) violations.push(`${t.name}: tenant_id es nullable`);
  if (!t.rls) violations.push(`${t.name}: RLS no habilitado`);
  if (!t.force_rls) violations.push(`${t.name}: falta FORCE ROW LEVEL SECURITY (el dueño vería todo)`);
  if (!hasPolicy.has(t.name)) violations.push(`${t.name}: sin política RLS`);
}

const exempt = tables.filter((t) => AUTH_TABLES.has(t.name)).map((t) => t.name);
console.log(`check:rls — ${tables.length} tablas: ${business.length} de negocio, ${exempt.length} auth exentas (${exempt.join(", ")})`);

if (violations.length > 0) {
  console.error("VIOLACIONES:\n" + violations.map((v) => " - " + v).join("\n"));
  process.exit(1);
}
console.log("check:rls OK — toda tabla de negocio tiene tenant_id NOT NULL + FORCE RLS + política");
await client.end();
