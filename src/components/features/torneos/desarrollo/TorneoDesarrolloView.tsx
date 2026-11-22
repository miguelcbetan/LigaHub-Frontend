import { CalendarCheck, CalendarClock, Layers, Swords, Trophy, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type {
  EstadoFaseDesarrollo,
  EstadoTorneo,
  GrupoDesarrolloDTO,
  TorneoDesarrolloDTO,
} from "@/lib/api/business-torneos";
import { LlavesFinales } from "./LlavesFinales";
import { PartidoDesarrolloItem } from "./PartidoDesarrolloItem";
import { TablaPosiciones } from "./TablaPosiciones";

const ESTADO_TORNEO: Record<EstadoTorneo, { label: string; tone: "yellow" | "blue" | "neutral" }> = {
  PENDIENTE: { label: "Pendiente", tone: "yellow" },
  EN_CURSO: { label: "En curso", tone: "blue" },
  FINALIZADO: { label: "Finalizado", tone: "neutral" },
};

const ESTADO_FASE: Record<EstadoFaseDesarrollo, { label: string; tone: "yellow" | "blue" | "neutral" }> = {
  PENDIENTE: { label: "Pendiente", tone: "yellow" },
  EN_CURSO: { label: "En curso", tone: "blue" },
  FINALIZADA: { label: "Finalizada", tone: "neutral" },
};

interface TorneoDesarrolloViewProps {
  desarrollo: TorneoDesarrolloDTO;
  nombreJugador: (userId: number | null) => string;
}

/** HU-GC-08: estructura y desarrollo completo de un torneo. */
export function TorneoDesarrolloView({ desarrollo, nombreJugador }: TorneoDesarrolloViewProps) {
  const { torneo, resumen, etapas } = desarrollo;
  const etapasGrupos = etapas.filter((etapa) => etapa.tipo === "GRUPOS");
  const etapasFinales = etapas.filter((etapa) => etapa.tipo === "FINAL");
  const estado = ESTADO_TORNEO[torneo.estado];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          icon={<Trophy />}
          title="Información general"
          action={
            <div className="flex gap-2">
              <Badge tone={estado.tone}>{estado.label}</Badge>
              <Badge tone={torneo.activo ? "success" : "neutral"}>
                {torneo.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          }
        />
        <div className="grid gap-6 px-5 py-4 lg:grid-cols-[1fr_auto]">
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <Dato label="Descripción" className="sm:col-span-3">
              {torneo.descripcion || "Sin descripción"}
            </Dato>
            <Dato label="Deporte">{torneo.deporte_nombre ?? "No disponible"}</Dato>
            <Dato label="Cupo de equipos">{torneo.max_equipos}</Dato>
            <Dato label="Fases registradas">{resumen.total_fases}</Dato>
          </dl>
          <div className="grid grid-cols-3 gap-3">
            <Indicador icon={<Swords />} label="Partidos" valor={resumen.total_partidos} />
            <Indicador
              icon={<CalendarCheck />}
              label="Con resultado"
              valor={resumen.partidos_con_resultado}
            />
            <Indicador
              icon={<CalendarClock />}
              label="Pendientes"
              valor={resumen.partidos_pendientes}
            />
          </div>
        </div>
      </Card>

      {etapas.length === 0 && (
        <Card>
          <EmptyState
            icon={<Layers />}
            title="El torneo aún no tiene fases"
            description="Cuando se registren fases, grupos y partidos aparecerán aquí."
          />
        </Card>
      )}

      {etapasGrupos.map((etapa) => (
        <Card key={`grupos-${etapa.numero_orden}`}>
          <CardHeader
            icon={<Users />}
            title={`Etapa ${etapa.numero_orden} · Fase de grupos`}
            description={`${etapa.grupos.length} ${etapa.grupos.length === 1 ? "grupo" : "grupos"}`}
          />
          <div className="grid gap-4 p-5 xl:grid-cols-2">
            {etapa.grupos.map((grupo) => (
              <GrupoCard key={grupo.fase.id} grupo={grupo} nombreJugador={nombreJugador} />
            ))}
          </div>
        </Card>
      ))}

      {etapasFinales.length > 0 && (
        <Card>
          <CardHeader
            icon={<Trophy />}
            title="Fase final"
            description="Llaves de eliminación directa por ronda."
          />
          <div className="p-5">
            <LlavesFinales etapas={etapasFinales} nombreJugador={nombreJugador} />
          </div>
        </Card>
      )}
    </div>
  );
}

function GrupoCard({
  grupo,
  nombreJugador,
}: {
  grupo: GrupoDesarrolloDTO;
  nombreJugador: (userId: number | null) => string;
}) {
  const estado = ESTADO_FASE[grupo.fase.estado];
  return (
    <section
      aria-label={grupo.nombre}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{grupo.nombre}</h3>
          <p className="text-xs text-zinc-500">
            {grupo.fase.fecha_inicio} – {grupo.fase.fecha_fin} · {grupo.equipos.length}
            {grupo.cupo_equipos ? ` de ${grupo.cupo_equipos}` : ""} equipos
          </p>
        </div>
        <Badge tone={estado.tone}>{estado.label}</Badge>
      </header>

      <TablaPosiciones posiciones={grupo.tabla_posiciones} />

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Partidos
        </h4>
        {grupo.partidos.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no hay partidos programados.</p>
        ) : (
          <ul className="space-y-2">
            {grupo.partidos.map((partido) => (
              <PartidoDesarrolloItem
                key={partido.id}
                partido={partido}
                nombreJugador={nombreJugador}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Dato({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{children}</dd>
    </div>
  );
}

function Indicador({ icon, label, valor }: { icon: ReactNode; label: string; valor: number }) {
  return (
    <div className="flex min-w-24 flex-col items-center rounded-xl border border-zinc-200 bg-white px-3 py-3 text-center dark:border-zinc-800 dark:bg-zinc-900 [&>svg]:size-4 [&>svg]:text-co-blue dark:[&>svg]:text-co-yellow">
      {icon}
      <span className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
        {valor}
      </span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}
