-- 001: seguridad RLS e integridad del dominio (combinada con el harness demo de 000).
-- tenant_id es TEXT (= organization.id de Better Auth, 32 chars). Sin FK a tablas de auth:
-- el aislamiento lo garantiza la política RLS, no una foreign key.
-- Patrón canónico: NULLIF(current_setting(...), '')::text — sin contexto (NULL o '') = 0 filas.

-- ─── demo de 000 (harness del check runtime; se elimina en 002) ───────────────
CREATE TABLE "_demo_tenant_rows" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL,
  "note" text NOT NULL
);
ALTER TABLE "_demo_tenant_rows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_demo_tenant_rows" FORCE ROW LEVEL SECURITY;
CREATE POLICY "demo_tenant_isolation" ON "_demo_tenant_rows"
  USING ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), ''))
  WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), ''));

-- ─── producto ────────────────────────────────────────────────────────────────
ALTER TABLE "producto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "producto" FORCE ROW LEVEL SECURITY;
CREATE POLICY "producto_tenant_isolation" ON "producto"
  USING ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), ''))
  WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), ''));

-- Defensa en profundidad de D-004: el saldo NUNCA puede ser negativo, ni siquiera por bug de app.
ALTER TABLE "producto" ADD CONSTRAINT producto_stock_no_negativo_chk CHECK ("stock" >= 0);
ALTER TABLE "producto" ADD CONSTRAINT producto_costo_no_negativo_chk CHECK ("costo_promedio" >= 0);

-- Código de barras único por tenant cuando existe.
CREATE UNIQUE INDEX "producto_tenant_codigo_uidx" ON "producto" ("tenant_id", "codigo_barras")
  WHERE "codigo_barras" IS NOT NULL;

-- ─── movimiento ──────────────────────────────────────────────────────────────
ALTER TABLE "movimiento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "movimiento" FORCE ROW LEVEL SECURITY;
CREATE POLICY "movimiento_tenant_isolation" ON "movimiento"
  USING ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), ''))
  WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), ''));

-- Integridad del kardex (dominio §3): tipos cerrados, sentido ±1, cantidad positiva,
-- ajuste SIEMPRE con motivo.
ALTER TABLE "movimiento" ADD CONSTRAINT movimiento_tipo_chk
  CHECK ("tipo" IN ('entrada', 'salida', 'ajuste'));
ALTER TABLE "movimiento" ADD CONSTRAINT movimiento_sentido_chk
  CHECK ("sentido" IN (1, -1));
ALTER TABLE "movimiento" ADD CONSTRAINT movimiento_cantidad_positiva_chk
  CHECK ("cantidad" > 0);
ALTER TABLE "movimiento" ADD CONSTRAINT movimiento_ajuste_requiere_motivo_chk
  CHECK ("tipo" <> 'ajuste' OR "motivo" IS NOT NULL);

-- Append-only real (no convención): la app (app_conn) jamás edita ni borra el kardex.
REVOKE UPDATE, DELETE ON "movimiento" FROM app_conn;
