import type { PosicionDTO } from "@/lib/api/business-torneos";
import { cn } from "@/utils/cn";

const COLUMNAS: { key: keyof Omit<PosicionDTO, "equipo" | "posicion">; label: string; title: string }[] = [
  { key: "pj", label: "PJ", title: "Partidos jugados" },
  { key: "pg", label: "PG", title: "Partidos ganados" },
  { key: "pe", label: "PE", title: "Partidos empatados" },
  { key: "pp", label: "PP", title: "Partidos perdidos" },
  { key: "gf", label: "GF", title: "Goles a favor" },
  { key: "gc", label: "GC", title: "Goles en contra" },
  { key: "dg", label: "DG", title: "Diferencia de gol" },
  { key: "pts", label: "Pts", title: "Puntos" },
];

/** Tabla de posiciones de un grupo (solo cuentan partidos finalizados). */
export function TablaPosiciones({ posiciones }: { posiciones: PosicionDTO[] }) {
  if (posiciones.length === 0) {
    return <p className="text-sm text-zinc-500">El grupo aún no tiene equipos asignados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Tabla de posiciones</caption>
        <thead>
          <tr className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
            <th scope="col" className="px-2 py-2 text-left font-medium">#</th>
            <th scope="col" className="px-2 py-2 text-left font-medium">Equipo</th>
            {COLUMNAS.map((columna) => (
              <th
                key={columna.key}
                scope="col"
                title={columna.title}
                className="px-2 py-2 text-right font-medium"
              >
                {columna.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {posiciones.map((fila) => (
            <tr
              key={fila.equipo.id}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
            >
              <td className="px-2 py-2 tabular-nums text-zinc-500">{fila.posicion}</td>
              <td className="px-2 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                {fila.equipo.nombre}
              </td>
              {COLUMNAS.map((columna) => (
                <td
                  key={columna.key}
                  className={cn(
                    "px-2 py-2 text-right tabular-nums text-zinc-700 dark:text-zinc-300",
                    columna.key === "pts" && "font-bold text-zinc-900 dark:text-zinc-50",
                  )}
                >
                  {columna.key === "dg" && fila.dg > 0 ? `+${fila.dg}` : fila[columna.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
