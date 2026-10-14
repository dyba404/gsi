import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Migraciones SIEMPRE con el rol dueño del schema (app_owner), nunca con app_conn.
export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
