import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "../db/schema";
import { ac, gsiRoles } from "./access";

// Better Auth consulta sus tablas globales (user, session, organization, member, invitation)
// SIN contexto de tenant: son la excepción deliberada sin RLS (specs/000-fundacion/plan.md).
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  // Dev/E2E: el rate limit por defecto patea los flujos de QA. F2: habilitar con store Redis en producción.
  rateLimit: { enabled: false },
  // Dev/E2E: el server corre en 3000 (next dev) o 4321 (playwright.config webServer).
  trustedOrigins: ["http://localhost:3000", "http://localhost:4321"],
  plugins: [
    organization({
      // Roles GSI declarados (T-11): la invitación valida contra estas claves.
      ac,
      roles: gsiRoles,
      // T-08: transport de dev. En producción (F2) reemplazar por proveedor real (Resend, propuesta).
      sendInvitationEmail: async ({ email, organization, invitation }) => {
        console.log(
          `[invitacion] ${email} → ${organization.name} (rol: ${invitation.role ?? "member"}) — link: /invitacion/${invitation.id}`,
        );
      },
    }),
  ],
});
