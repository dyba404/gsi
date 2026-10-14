// Roles y matriz de permisos (T-11). Puro — importable desde cliente y servidor.

export const ROLES = ["owner", "admin", "almacen", "venta"] as const;
export type Role = (typeof ROLES)[number];

export const ETIQUETA_ROL: Record<Role, string> = {
  owner: "Dueño",
  admin: "Administrador",
  almacen: "Almacén",
  venta: "Venta",
};

// "*" = todo. Permisos nombrados <dominio>:<accion>; los consumen los guards.
export const PERMISOS: Record<Role, string[]> = {
  owner: ["*"],
  admin: [
    "equipo:ver",
    "equipo:invitar",
    "stock:ver",
    "stock:mover",
    "productos:administrar",
    "reportes:ver",
  ],
  almacen: [
    "equipo:ver",
    "stock:ver",
    "stock:mover",
    "productos:administrar",
  ],
  venta: [
    "stock:ver",
  ],
};

export function esRol(v: string): v is Role {
  return (ROLES as readonly string[]).includes(v);
}

export function puede(rol: Role, permiso: string): boolean {
  const lista = PERMISOS[rol];
  return lista.includes("*") || lista.includes(permiso);
}
