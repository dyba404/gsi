import "dotenv/config";
import { expect, test } from "@playwright/test";
import pg from "pg";

// Ciclo completo de spec 000 (T-07/T-08/T-09/T-11):
// dueño se registra con empresa → invita a almacén → invitado se registra sin empresa,
// abre el link de invitación, se acepta sola y entra al equipo con su rol;
// el guard por rol le oculta el formulario de invitación.

const sufijo = Date.now();
const empresa = `Bodega QATest ${sufijo}`;
const duenoEmail = `dueno.${sufijo}@qa.test`;
const invitadoEmail = `invitado.${sufijo}@qa.test`;
const password = "ClaveSegura123";

test("registro con empresa, invitación, aceptación y guard por rol", async ({ browser }) => {
  // ---- Dueño: registro con empresa ----
  const ctxDueno = await browser.newContext();
  const pageDueno = await ctxDueno.newPage();

  await pageDueno.goto("/registrarse");
  await pageDueno.getByLabel("Tu nombre").fill("Dueno QATest");
  await pageDueno.getByLabel("Empresa (opcional)").fill(empresa);
  await pageDueno.getByLabel("Email").fill(duenoEmail);
  await pageDueno.getByLabel("Contraseña").fill(password);
  await pageDueno.getByRole("button", { name: "Crear cuenta" }).click();

  await pageDueno.waitForURL("**/dashboard");
  await pageDueno.goto("/equipo"); // gestión de equipo
  await expect(pageDueno.getByRole("heading", { name: "Equipo" })).toBeVisible();
  await expect(pageDueno.getByText(empresa).first()).toBeVisible();
  await expect(pageDueno.getByText("Dueño").first()).toBeVisible();
  await expect(pageDueno.getByLabel("Email a invitar")).toBeVisible(); // owner puede invitar

  // ---- Invitación con rol Almacén ----
  await pageDueno.getByLabel("Email a invitar").fill(invitadoEmail);
  // shadcn Select: abrir y elegir
  await pageDueno.getByRole("combobox").click();
  await pageDueno.getByRole("option", { name: "Almacén" }).click();
  await pageDueno.getByRole("button", { name: "Invitar" }).click();
  await expect(pageDueno.getByText(new RegExp(`Invitación enviada a ${invitadoEmail}`))).toBeVisible();

  // ---- Leer el id de la invitación (transport de dev = log; la BD es la fuente) ----
  const owner = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await owner.connect();
  const res = await owner.query<{ id: string }>(
    "SELECT id FROM invitation WHERE email = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
    [invitadoEmail],
  );
  expect(res.rows.length).toBe(1);
  const invitationId = res.rows[0].id;
  await owner.end();

  // ---- Invitado: registro sin empresa, acepta invitación por link ----
  const ctxInvitado = await browser.newContext();
  const pageInvitado = await ctxInvitado.newPage();

  await pageInvitado.goto("/registrarse");
  await pageInvitado.getByLabel("Tu nombre").fill("Invitado QATest");
  await pageInvitado.getByLabel("Email").fill(invitadoEmail);
  await pageInvitado.getByLabel("Contraseña").fill(password);
  // Empresa (opcional) queda vacía: fue invitado, no crea empresa
  await pageInvitado.getByRole("button", { name: "Crear cuenta" }).click();

  // Sin organización activa → /sin-empresa (sin rebote infinito con login)
  await pageInvitado.waitForURL("**/sin-empresa");

  await pageInvitado.goto(`/invitacion/${invitationId}`);
  await expect(pageInvitado.getByText("Invitación aceptada").or(pageInvitado.getByText("Aceptando invitación…"))).toBeVisible();

  await pageInvitado.waitForURL("**/equipo");
  await expect(pageInvitado.getByText(empresa).first()).toBeVisible();
  await expect(pageInvitado.getByText("Almacén").first()).toBeVisible();
  await expect(pageInvitado.getByText("Dueno QATest")).toBeVisible();

  // ---- Guard por rol (T-11): Almacén no ve el formulario de invitación ----
  await expect(pageInvitado.getByLabel("Email a invitar")).toHaveCount(0);
  await expect(pageInvitado.getByText(/no puede invitar personas/)).toBeVisible();

  await ctxDueno.close();
  await ctxInvitado.close();
});
