import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../db/schema";

function requireUrl(envVar: string): string {
  const url = process.env[envVar];
  if (!url) throw new Error(`Falta ${envVar} en el entorno (ver .env.example)`);
  return url;
}

// Runtime de la app: rol app_conn, restringido por RLS a las filas del tenant
// en contexto (ver specs/000-fundacion/plan.md §RLS). Nada de negocio fuera de withTenant().
export const db: NodePgDatabase<typeof schema> = drizzle(
  new Pool({ connectionString: requireUrl("APP_DATABASE_URL"), max: 10 }),
  { schema },
);

// Dueño del schema: SOLO migraciones y scripts de mantenimiento. Jamás en el request path:
// FORCE ROW LEVEL SECURITY lo obliga igual, pero el principio es no conectarlo nunca a la app.
let ownerDb: NodePgDatabase<typeof schema> | null = null;

export function getOwnerDb(): NodePgDatabase<typeof schema> {
  ownerDb ??= drizzle(new Pool({ connectionString: requireUrl("DATABASE_URL"), max: 2 }));
  return ownerDb;
}
