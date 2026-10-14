import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

// Control de acceso compartido server/client. Los statements espejan la matriz de
// permisos de lib/roles.ts (T-11); los defaults cubren los recursos del plugin.
export const ac = createAccessControl({
  ...defaultStatements,
  equipo: ["ver", "invitar"],
  stock: ["ver", "mover"],
  productos: ["administrar"],
  reportes: ["ver"],
});

export const gsiRoles = {
  owner: ac.newRole({
    organization: ["update", "delete"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    team: ["create", "update", "delete"],
    ac: ["create", "read", "update", "delete"],
    equipo: ["ver", "invitar"],
    stock: ["ver", "mover"],
    productos: ["administrar"],
    reportes: ["ver"],
  }),
  admin: ac.newRole({
    equipo: ["ver", "invitar"],
    stock: ["ver", "mover"],
    productos: ["administrar"],
    reportes: ["ver"],
  }),
  almacen: ac.newRole({
    equipo: ["ver"],
    stock: ["ver", "mover"],
    productos: ["administrar"],
  }),
  venta: ac.newRole({
    stock: ["ver"],
  }),
};
