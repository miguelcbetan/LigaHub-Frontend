import type { LocalidadDTO } from "./business-localidades";
import { request } from "./business-torneos";

export interface EscenarioDTO {
  id: string;
  nombre: string;
  direccion: string;
  capacidad: number;
  /** null cuando es un escenario raíz (HU-A). */
  escenario_padre_id?: string | null;
  sub_escenarios?: EscenarioDTO[];
  localidades?: LocalidadDTO[];
  partidos?: { id: string }[];
  escenarios_torneo?: { id: string }[];
}

export interface EscenarioInput {
  nombre: string;
  direccion: string;
  capacidad: number;
  /** En edición, null quita el escenario padre. */
  escenario_padre_id?: string | null;
}

const ESCENARIOS = "/api/business/escenarios";
const escenarioUrl = (id: string) => `${ESCENARIOS}/${encodeURIComponent(id)}`;

export const businessEscenariosApi = {
  findAll() {
    return request<EscenarioDTO[]>(ESCENARIOS);
  },

  findOne(id: string) {
    return request<EscenarioDTO>(escenarioUrl(id));
  },

  create(input: EscenarioInput) {
    return request<EscenarioDTO>(ESCENARIOS, { method: "POST", body: input });
  },

  update(id: string, input: Partial<EscenarioInput>) {
    return request<EscenarioDTO>(escenarioUrl(id), { method: "PATCH", body: input });
  },

  remove(id: string) {
    return request<{ message: string }>(escenarioUrl(id), { method: "DELETE" });
  },
};
