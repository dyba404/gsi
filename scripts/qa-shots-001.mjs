// QA de navegador (AGENTS.md): capturas dark/light × desktop/móvil de las pantallas de 001.
// Requiere server en QA_BASE_URL (default :4321). Salida: _shots/*.png — leer, arreglar, BORRAR al final.
import "dotenv/config";
import fs from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.QA_BASE_URL ?? "http://localhost:4321";
const dir = "_shots";
fs.mkdirSync(dir, { recursive: true });

const SUFIJO = Date.now();
const email = `qa.001.${SUFIJO}@qa.test`;
const password = "ClaveSegura123";
const empresa = `Distribuidora Shots ${SUFIJO}`;
const producto = `Aceite Primor 1L ${SUFIJO}`;
const sku = `ACEITE-${SUFIJO}`;

const shots = [];

async function capturar(browser, { tema, viewport, nombre, ruta }, preparar) {
  const ctx = await browser.newContext({
    colorScheme: tema === "dark" ? "dark" : "light",
    viewport,
    locale: "es-PE",
  });
  const page = await ctx.newPage();
  if (preparar) await preparar(page);
  else await page.goto(`${BASE}${ruta}`);
  await page.waitForTimeout(700);
  const archivo = `${dir}/${nombre}.png`;
  await page.screenshot({ path: archivo, fullPage: false });
  shots.push(archivo);
  await ctx.close();
}

async function entrar(page) {
  await page.goto(`${BASE}/iniciar-sesion`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/dashboard");
}

const browser = await chromium.launch();

// ── Seed por UI: registro → producto → entrada 120 @ 8.90 → salida 15 ──
const setup = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "es-PE" });
const sp = await setup.newPage();
await sp.goto(`${BASE}/registrarse`);
await sp.getByLabel("Tu nombre").fill("QA 001");
await sp.getByLabel("Empresa (opcional)").fill(empresa);
await sp.getByLabel("Email").fill(email);
await sp.getByLabel("Contraseña").fill(password);
await sp.getByRole("button", { name: "Crear cuenta" }).click();
await sp.waitForURL("**/dashboard");

await sp.goto(`${BASE}/productos/nuevo`);
await sp.getByLabel("SKU *").fill(sku);
await sp.getByLabel("Nombre *").fill(producto);
await sp.getByLabel("Stock mínimo").fill("20");
await sp.getByRole("button", { name: "Crear producto" }).click();
await sp.waitForURL("**/productos/**");
const urlFicha = new URL(sp.url()).pathname;

for (const [tipo, cantidad, extra] of [["entrada", "120", "8.90"], ["salida", "15", null]]) {
  await sp.goto(`${BASE}/movimientos/nuevo`);
  await sp.getByLabel("Producto *").fill(sku);
  await sp.getByRole("option", { name: new RegExp(producto) }).click();
  await sp.getByLabel("Tipo *").click();
  await sp.getByRole("option", { name: new RegExp(tipo === "entrada" ? "Entrada" : "Salida") }).click();
  if (extra) await sp.getByLabel("Costo unitario *").fill(extra);
  await sp.getByLabel("Cantidad *").fill(cantidad);
  await sp.getByRole("button", { name: "Confirmar movimiento" }).click();
  await sp.waitForURL("**/productos/**");
}
await setup.close();

const pantallasApp = [
  { ruta: "/dashboard", nombre: "dashboard" },
  { ruta: "/productos", nombre: "productos" },
  { ruta: "/productos/nuevo", nombre: "productos-nuevo" },
  { ruta: "/movimientos/nuevo", nombre: "movimiento-nuevo" },
  { ruta: urlFicha, nombre: "producto-kardex" },
];

for (const p of pantallasApp) {
  for (const tema of ["dark", "light"]) {
    await capturar(browser, { tema, viewport: { width: 1440, height: 900 }, ...p }, entrar);
    await capturar(browser, { tema, viewport: { width: 390, height: 844 }, ...p }, entrar);
  }
}

await browser.close();
console.log(`OK: ${shots.length} capturas en ${dir}/`);
for (const s of shots) console.log(" -", s);
