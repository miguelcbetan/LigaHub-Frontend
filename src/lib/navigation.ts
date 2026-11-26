import {
  Building2,
  CircleUserRound,
  ClipboardList,
  Coins,
  CreditCard,
  Dices,
  Dumbbell,
  Grid3x3,
  Heart,
  KeyRound,
  LayoutDashboard,
  MapPin,
  Medal,
  Shield,
  ShieldCheck,
  Sparkles,
  Swords,
  Ticket,
  TicketCheck,
  Trophy,
  UserRound,
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
        href: "/deportes",
        label: "Deportes",
        icon: Dumbbell,
        requires: (access) => access.hasPermission("/deportes", "GET"),
      },
      {
        href: "/equipos",
        label: "Equipos",
        icon: Shield,
        requires: (access) => access.hasPermission("/equipos", "GET"),
      },
      {
        href: "/jugadores",
        label: "Jugadores",
        icon: UserRound,
        requires: (access) => access.hasPermission("/jugadores", "GET"),
      },
      {
        href: "/habilidades",
        label: "Habilidades",
        icon: Sparkles,
        requires: (access) => access.hasPermission("/habilidades", "GET"),
      },
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
        href: "/escenarios",
        label: "Escenarios",
        icon: Building2,
        requires: (access) => access.hasPermission("/escenarios", "GET"),
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
        label: "Fases de torneo",
        icon: Medal,
        requires: (access) => access.hasPermission("/fases", "GET"),
      },
      {
        href: "/partidos",
        label: "Partidos",
        icon: Swords,
        requires: (access) => access.hasPermission("/partidos", "GET"),
      },
      {
        href: "/metodos-pago-aficionado",
        label: "Métodos de pago de aficionados",
        icon: CreditCard,
        requires: (access) => access.hasPermission("/metodos-pago-aficionado", "GET"),
      },
      {
        href: "/boletos",
        label: "Boletos",
        icon: TicketCheck,
        requires: (access) => access.hasPermission("/boletas", "GET"),
      },
      {
        href: "/apuestas",
        label: "Apuestas",
        icon: Coins,
        requires: (access) => access.hasPermission("/apuestas", "GET"),
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
      {
        href: "/mis-equipos",
        label: "Mis equipos",
        icon: Heart,
        // HU-GE-05: el aficionado se resuelve por el token, como /api/profile/me.
        requires: (a) => a.hasPermission("/aficionados/me", "GET"),
      },
      {
        href: "/mis-metodos-pago",
        label: "Mis métodos de pago",
        icon: CreditCard,
        requires: (a) => a.hasPermission("/aficionados/me/metodos-pago", "GET"),
      },
      {
        href: "/mis-boletos",
        label: "Mis boletos",
        icon: Ticket,
        requires: (a) => a.hasPermission("/aficionados/me/boletas", "GET"),
      },
      {
        href: "/mis-apuestas",
        label: "Mis apuestas",
        icon: Dices,
        requires: (a) => a.hasPermission("/aficionados/me/apuestas", "GET"),
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
