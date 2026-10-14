import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";

// Los 4 casos del plan (specs/000-fundacion/plan.md §Tests) contra Postgres real,
// más el mutation test: apagar RLS debe romper el aislamiento (si no, los tests no miden nada).

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";

let owner: pg.Client;
let conn: pg.Client;

beforeAll(async () => {
  owner = new pg.Client({ connectionString: process.env.DATABASE_URL });
  conn = new pg.Client({ connectionString: process.env.APP_DATABASE_URL });
  await owner.connect();
  await conn.connect();
  // FORCE RLS le aplica también al owner: seed por contexto transaccional, limpieza por TRUNCATE.
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
});

afterAll(async () => {
  await owner.end();
  await conn.end();
});

// Contexto transaccional como el helper real (lib/tenant.ts): set_config(..., true) = SET LOCAL.
async function withCtx<T>(tenant: string, fn: () => Promise<T>): Promise<T> {
  await conn.query("BEGIN");
  await conn.query("SELECT set_config('app.current_tenant', $1, true)", [tenant]);
  try {
    const result = await fn();
    await conn.query("COMMIT");
    return result;
  } catch (e) {
    await conn.query("ROLLBACK");
    throw e;
  }
}

describe("aislamiento por tenant (criterio central de spec 000)", () => {
  it("1. sin contexto no se ve ninguna fila (RLS bloquea por defecto)", async () => {
    const { rows } = await conn.query<{ c: number }>(
      "SELECT count(*)::int AS c FROM _demo_tenant_rows",
    );
    expect(rows[0].c).toBe(0);
  });

  it("2. con contexto del tenant A solo se ven filas de A", async () => {
    await withCtx(TENANT_A, async () => {
      const { rows } = await conn.query<{ note: string }>(
        "SELECT note FROM _demo_tenant_rows ORDER BY note",
      );
      expect(rows.map((r) => r.note)).toEqual(["A1", "A2"]);
    });
  });

  it("3. INSERT con tenant_id de B en contexto A es rechazado (WITH CHECK)", async () => {
    await expect(
      withCtx(TENANT_A, async () => {
        await conn.query(
          "INSERT INTO _demo_tenant_rows (tenant_id, note) VALUES ($1, 'intruso')",
          [TENANT_B],
        );
      }),
    ).rejects.toThrow();
  });

  it("4. UPDATE cruzado no toca filas de B (no encuentra filas)", async () => {
    await withCtx(TENANT_A, async () => {
      const res = await conn.query("UPDATE _demo_tenant_rows SET note = 'hack' WHERE note = 'B1'");
      expect(res.rowCount).toBe(0);
    });
  });

  it("mutation: apagar RLS expone todo (los grants de app_conn siguen ahí) — los tests miden RLS", async () => {
    await owner.query("ALTER TABLE _demo_tenant_rows DISABLE ROW LEVEL SECURITY");
    try {
      const { rows } = await conn.query<{ c: number }>(
        "SELECT count(*)::int AS c FROM _demo_tenant_rows",
      );
      expect(rows[0].c).toBe(3);
    } finally {
      await owner.query("ALTER TABLE _demo_tenant_rows ENABLE ROW LEVEL SECURITY");
    }
  });
});
