import { sql } from "drizzle-orm";
import { db } from "./db";

type TenantTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type { TenantTx };

// Única vía de acceso a datos de negocio (specs/000-fundacion/plan.md §RLS.4):
// abre transacción y fija el tenant con set_config(..., true) → SET LOCAL, muere
// al cerrar la transacción, así que es seguro con pooling. Nunca SET global.
export async function withTenant<T>(tenantId: string, fn: (tx: TenantTx) => Promise<T>): Promise<T> {
  // El tenant_id es organization.id de Better Auth (string de 32 chars, NO uuid).
  // Validación básica: no vacío, tamaño razonable. El aislamiento lo garantiza RLS.
  if (!tenantId || tenantId.length < 8 || tenantId.length > 64) {
    throw new Error(`tenantId inválido`);
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_tenant', ${tenantId}, true)`);
    return fn(tx);
  });
}
