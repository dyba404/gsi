import "dotenv/config";
import { expect, test } from "@playwright/test";

// Ciclo de spec 001: alta de producto → entrada → salida → kardex →
// venta sin stock bloqueada con mensaje visible → aislamiento entre tenants por UI.

const sufijo = Date.now();
const empresa = `Ferreteria QA ${sufijo}`;
const dueno = `ferretero.${sufijo}@qa.test`;
const password = "ClaveSegura123";
const producto = `Arroz Extra ${sufijo}`;
const sku = `ARROZ-${sufijo}`;

test("núcleo de stock: entrada, salida, kardex, bloqueo y aislamiento", async ({ browser }) => {
  const ctx = await browser.newContext({ locale: "es-PE" });
  const page = await ctx.newPage();

  // Registro con empresa → dashboard
  await page.goto("/registrarse");
  await page.getByLabel("Tu nombre").fill("Ferretero QA");
  await page.getByLabel("Empresa (opcional)").fill(empresa);
  await page.getByLabel("Email").fill(dueno);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.waitForURL("**/dashboard");

  // Alta de producto
  await page.goto("/productos/nuevo");
  await page.getByLabel("SKU *").fill(sku);
  await page.getByLabel("Nombre *").fill(producto);
  await page.getByLabel("Stock mínimo").fill("5");
  await page.getByRole("button", { name: "Crear producto" }).click();
  await page.waitForURL("**/productos/**"); // redirige a la ficha del producto
  await expect(page.getByText(producto).first()).toBeVisible();
  await expect(page.getByText("AGOTADO").first()).toBeVisible(); // badge color+texto

  // Entrada 50 @ 3.50
  await page.goto("/movimientos/nuevo");
  await page.getByLabel("Producto *").fill(sku);
  await page.getByRole("option", { name: new RegExp(producto) }).click();
  await page.getByLabel("Tipo *").click();
  await page.getByRole("option", { name: /Entrada/ }).click();
  await page.getByLabel("Costo unitario *").fill("3.50");
  await page.getByLabel("Cantidad *").fill("50");
  await page.getByRole("button", { name: "Confirmar movimiento" }).click();
  await page.waitForURL("**/productos/**");
  await expect(page.getByText("Kardex")).toBeVisible();
  await expect(page.getByText("Entrada +").first()).toBeVisible();
  await expect(page.getByText("50 UND").first()).toBeVisible(); // stock actual en la ficha

  // Salida 10
  await page.goto("/movimientos/nuevo");
  await page.getByLabel("Producto *").fill(sku);
  await page.getByRole("option", { name: new RegExp(producto) }).click();
  await page.getByLabel("Tipo *").click();
  await page.getByRole("option", { name: /Salida/ }).click();
  await page.getByLabel("Cantidad *").fill("10");
  await page.getByRole("button", { name: "Confirmar movimiento" }).click();
  await page.waitForURL("**/productos/**");
  await expect(page.getByText("Salida −").first()).toBeVisible();

  // Venta sin stock: bloqueada con mensaje visible (D-004)
  await page.goto("/movimientos/nuevo");
  await page.getByLabel("Producto *").fill(sku);
  await page.getByRole("option", { name: new RegExp(producto) }).click();
  await page.getByLabel("Tipo *").click();
  await page.getByRole("option", { name: /Salida/ }).click();
  await page.getByLabel("Cantidad *").fill("100");
  await page.getByRole("button", { name: "Confirmar movimiento" }).click();
  await expect(page.getByText(/Stock insuficiente/)).toBeVisible();

  // Ajuste faltante con motivo obligatorio
  await page.goto("/movimientos/nuevo");
  await page.getByLabel("Producto *").fill(sku);
  await page.getByRole("option", { name: new RegExp(producto) }).click();
  await page.getByLabel("Tipo *").click();
  await page.getByRole("option", { name: /Ajuste/ }).click();
  await page.getByLabel("Dirección *").click();
  await page.getByRole("option", { name: /Faltante/ }).click();
  await page.getByLabel("Cantidad *").fill("2");
  await page.getByRole("button", { name: "Confirmar movimiento" }).click();
  await expect(page.getByText(/requiere motivo/i).or(page.getByLabel("Motivo *"))).toBeVisible();
  await page.getByLabel("Motivo *").fill("merma por rotura");
  await page.getByRole("button", { name: "Confirmar movimiento" }).click();
  await page.waitForURL("**/productos/**");
  await expect(page.getByText("Ajuste −").first()).toBeVisible();
  await expect(page.getByText("merma por rotura").first()).toBeVisible();

  // ── Aislamiento por UI: otro tenant no ve nada ──
  const ctxB = await browser.newContext({ locale: "es-PE" });
  const pageB = await ctxB.newPage();
  await pageB.goto("/registrarse");
  await pageB.getByLabel("Tu nombre").fill("Vecino QA");
  await pageB.getByLabel("Empresa (opcional)").fill(`Bodega Vecina ${sufijo}`);
  await pageB.getByLabel("Email").fill(`vecino.${sufijo}@qa.test`);
  await pageB.getByLabel("Contraseña").fill(password);
  await pageB.getByRole("button", { name: "Crear cuenta" }).click();
  await pageB.waitForURL("**/dashboard");
  await pageB.goto("/productos");
  await expect(pageB.getByText(/Todavía no hay productos/)).toBeVisible();
  await expect(pageB.getByText(producto)).toHaveCount(0);

  await ctx.close();
  await ctxB.close();
});
