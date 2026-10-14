import "dotenv/config";
import { Client } from "pg";

// Check de arranque (T-04, plan §RLS.3): la app NUNCA debe correr con un rol que pueda
// burlar RLS, y el aislamiento se prueba de fuego sobre la tabla demo antes de servir tráfico.
// En producción: fallar ruidoso. En dev: `npm run check:rls-runtime`.

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";

async function main(): Promise<void> {
  const conn = new Client({ connectionString: requireEnv("APP_DATABASE_URL") });
  const owner = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await conn.connect();
  await owner.connect();

  // 1. El rol runtime no puede burlar RLS.
  const { rows } = await conn.query<{ rolsuper: boolean; rolbypassrls: boolean }>(
    "SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user",
  );
  if (!rows[0]) throw new Error("No se pudo leer el rol de conexión");
  if (rows[0].rolsuper) throw new Error("FALLO: el rol runtime es superuser — RLS sería decorativo");
  if (rows[0].rolbypassrls) throw new Error("FALLO: el rol runtime tiene BYPASSRLS");

  // 2. Aislamiento de fuego sobre la tabla demo. FORCE RLS le aplica también al owner:
  // el seed va por contexto transaccional (la misma vía que la app) y la limpieza por TRUNCATE.
  await owner.query("TRUNCATE _demo_tenant_rows");
  const seed: Array<[string, string]> = [
    [TENANT_A, "A1"],
    [TENANT_A, "A2"],
    [TENANT_B, "B1"],
  ];
  for (const [tenant, note] of seed) {
    await conn.query("BEGIN");
    await conn.query("SELECT set_config('app.current_tenant', $1, true)", [tenant]);
    await conn.query("INSERT INTO _demo_tenant_rows (tenant_id, note) VALUES ($1, $2)", [tenant, note]);
    await conn.query("COMMIT");
  }

  const noCtx = await conn.query<{ c: number }>("SELECT count(*)::int AS c FROM _demo_tenant_rows");
  if (noCtx.rows[0].c !== 0) throw new Error(`FALLO: sin contexto se ven ${noCtx.rows[0].c} filas (deben ser 0)`);

  await conn.query("BEGIN");
  await conn.query("SELECT set_config('app.current_tenant', $1, true)", [TENANT_A]);
  const ctxA = await conn.query<{ note: string }>("SELECT note FROM _demo_tenant_rows ORDER BY note");
  await conn.query("COMMIT");
  if (ctxA.rows.length !== 2 || ctxA.rows.some((r) => r.note.startsWith("B"))) {
    throw new Error("FALLO: con contexto del tenant A se ven filas de B");
  }

  let crossRejected = false;
  try {
    await conn.query("BEGIN");
    await conn.query("SELECT set_config('app.current_tenant', $1, true)", [TENANT_A]);
    await conn.query("INSERT INTO _demo_tenant_rows (tenant_id, note) VALUES ($1, 'intruso')", [TENANT_B]);
    await conn.query("COMMIT");
  } catch {
    crossRejected = true;
    await conn.query("ROLLBACK").catch(() => {});
  }
  if (!crossRejected) throw new Error("FALLO: se pudo INSERTAR una fila de otro tenant");

  await owner.query("TRUNCATE _demo_tenant_rows");
  await conn.end();
  await owner.end();
  console.log("check:rls-runtime OK — rol sin poderes de bypass y aislamiento verificado");
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta ${name} en el entorno`);
  return v;
}

main().catch((e: unknown) => {
  console.error((e as Error).message);
  process.exit(1);
});
