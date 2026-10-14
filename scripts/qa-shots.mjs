// QA de navegador (AGENTS.md): capturas dark/light × desktop/móvil de las pantallas de 000.
// Uso: arrancar `npm run start` (o dev) en QA_BASE_URL (default :4321) y correr `node scripts/qa-shots.mjs`.
// Salida: _shots/*.png — leer cada captura, arreglar hallazgos y BORRAR _shots al terminar.
import "dotenv/config";
import fs from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.QA_BASE_URL ?? "http://localhost:4321";
const dir = "_shots";
fs.mkdirSync(dir, { recursive: true });

const SUFIJO = Date.now();
const email = `qa.shots.${SUFIJO}@qa.test`;
const password = "ClaveSegura123";
const empresa = `Bodega Shots ${SUFIJO}`;

const shots = [];
async function capturar(browser, { tema, viewport, nombre }, preparar) {
  const ctx = await browser.newContext({
    colorScheme: tema === "dark" ? "dark" : "light",
    viewport,
    locale: "es-PE",
  });
  const page = await ctx.newPage();
  await preparar(page);
  await page.waitForTimeout(600); // fuentes/hidratación
  const archivo = `${dir}/${nombre}.png`;
  await page.screenshot({ path: archivo, fullPage: false });
  shots.push(archivo);
  await ctx.close();
}

const browser = await chromium.launch();

// Credenciales listas: registrar una vez para poder entrar en cada contexto.
const setup = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "es-PE" });
const setupPage = await setup.newPage();
await setupPage.goto(`${BASE}/registrarse`);
await setupPage.getByLabel("Tu nombre").fill("QA Shots");
await setupPage.getByLabel("Empresa (opcional)").fill(empresa);
await setupPage.getByLabel("Email").fill(email);
await setupPage.getByLabel("Contraseña").fill(password);
await setupPage.getByRole("button", { name: "Crear cuenta" }).click();
await setupPage.waitForURL("**/equipo");
await setup.close();

async function entrarEquipo(page) {
  await page.goto(`${BASE}/iniciar-sesion`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in") && r.request().method() === "POST"),
    page.getByRole("button", { name: "Entrar" }).click(),
  ]);
  if (resp.status() !== 200) {
    console.error(`DEBUG sign-in ${resp.status()}:`, (await resp.text()).slice(0, 300));
  }
  await page.waitForURL("**/equipo");
}

const publicas = [
  { ruta: "/iniciar-sesion", nombre: "iniciar-sesion" },
  { ruta: "/registrarse", nombre: "registrarse" },
];

for (const { ruta, nombre } of publicas) {
  for (const tema of ["dark", "light"]) {
    await capturar(browser, { tema, viewport: { width: 1440, height: 900 }, nombre: `${nombre}-${tema}-desktop` }, (page) =>
      page.goto(`${BASE}${ruta}`),
    );
    await capturar(browser, { tema, viewport: { width: 390, height: 844 }, nombre: `${nombre}-${tema}-movil` }, (page) =>
      page.goto(`${BASE}${ruta}`),
    );
  }
}

for (const tema of ["dark", "light"]) {
  await capturar(browser, { tema, viewport: { width: 1440, height: 900 }, nombre: `equipo-${tema}-desktop` }, entrarEquipo);
  await capturar(browser, { tema, viewport: { width: 390, height: 844 }, nombre: `equipo-${tema}-movil` }, entrarEquipo);
}

await browser.close();
console.log(`OK: ${shots.length} capturas en ${dir}/`);
for (const s of shots) console.log(" -", s);
