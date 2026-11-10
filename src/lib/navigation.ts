import {
  CircleUserRound,
  ClipboardList,
  Grid3x3,
  KeyRound,
  LayoutDashboard,
  MapPin,
  Medal,
  ShieldCheck,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Access } from "@/lib/access";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  /** Sin `requires` el ítem es visible para cualquier usuario autenticado. */
  requires?: (access: Access) => boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "General",
    items: [{ href: "/dashboard", label: "Camerino", icon: LayoutDashboard }],
  },
  {
    title: "Seguridad",
    items: [
      {
        href: "/usuarios",
        label: "Usuarios",
        icon: Users,
        requires: (a) => a.hasModule("m-usuarios"),
      },
      {
        href: "/roles",
        label: "Roles",
        icon: ShieldCheck,
        requires: (a) => a.hasModule("m-roles"),
      },
      {
        href: "/permisos",
        label: "Permisos",
        icon: KeyRound,
        requires: (a) => a.hasModule("m-permisos"),
      },
      {
        href: "/matriz",
        label: "Matriz de permisos",
        icon: Grid3x3,
        requires: (a) => a.hasModule("m-roles-permisos"),
      },
    ],
  },
  {
    title: "Business",
    items: [
      {
        href: "/torneos",
        label: "Torneos",
        icon: Trophy,
        requires: (access) => access.hasPermission("/torneos", "GET"),
      },
      {
        href: "/inscripciones",
        label: "Inscripciones",
        icon: ClipboardList,
        requires: (access) => access.hasPermission("/inscripciones", "GET"),
      },
      {
        href: "/escenarios-torneo",
        label: "Escenarios de torneo",
        icon: MapPin,
        requires: (access) =>
          access.hasPermission("/escenarios-torneo", "GET"),
      },
      {
        href: "/fases-finales",
        label: "Fases finales",
        icon: Medal,
        requires: (access) => access.hasPermission("/fases", "GET"),
      },
    ],
  },
  {
    title: "Cuenta",
    items: [
      {
        href: "/perfil",
        label: "Mi perfil",
        icon: CircleUserRound,
        // La pantalla consume /api/profile/me, no los perfiles ajenos.
        requires: (a) => a.hasUrl("/api/profile/me"),
      },
    ],
  },
];

const isAllowed = (item: NavItem, access: Access) =>
  !item.requires || item.requires(access);

/** Secciones con solo los ítems permitidos; las que quedan vacías se descartan. */
export function visibleNavSections(access: Access): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => isAllowed(item, access)),
  })).filter((section) => section.items.length > 0);
}

/** `false` si la ruta pertenece a un ítem de navegación que el usuario no puede ver. */
export function canAccessPath(pathname: string, access: Access): boolean {
  const item = NAV_SECTIONS.flatMap((section) => section.items).find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
  return item ? isAllowed(item, access) : true;
}
