-- Roles y base del proyecto GSI (se ejecuta solo en el primer arranque del volumen).
-- postgres (superuser del contenedor) NO lo usa la app: solo bootstrap.
-- app_owner: dueño de schema/tablas, corre migraciones. FORCE ROW LEVEL SECURITY le aplica igual.
-- app_conn: conexión runtime de la app. RLS la restringe a las filas del tenant en contexto.

CREATE ROLE app_owner LOGIN PASSWORD 'dev_owner';
CREATE ROLE app_conn  LOGIN PASSWORD 'dev_conn';

CREATE DATABASE gsi_dev OWNER app_owner;

GRANT CONNECT ON DATABASE gsi_dev TO app_conn;

\connect gsi_dev

ALTER SCHEMA public OWNER TO app_owner;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO app_conn;

-- app_conn opera filas (los policies RLS deciden cuáles); app_owner crea la estructura.
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_conn;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_conn;
