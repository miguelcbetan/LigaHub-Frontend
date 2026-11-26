import { request } from "./business-torneos";

export interface LocalidadDTO {
  id: string;
  nombre: string;
  capacidad: number;
  precio: number;
  escenario_id: string;
  /** Boletas vendidas en la localidad; bloquean su eliminación. */
  boletas?: { id: string }[];
}

export interface LocalidadInput {
  nombre: string;
  capacidad: number;
  precio: number;
  escenario_id: string;
}

/** La localidad no cambia de escenario desde la interfaz. */
export type LocalidadUpdate = Partial<Omit<LocalidadInput, "escenario_id">>;

const LOCALIDADES = "/api/business/localidades";
const localidadUrl = (id: string) => `${LOCALIDADES}/${encodeURIComponent(id)}`;

export const businessLocalidadesApi = {
  findAll() {
    return request<LocalidadDTO[]>(LOCALIDADES);
  },

  findOne(id: string) {
    return request<LocalidadDTO>(localidadUrl(id));
  },

  create(input: LocalidadInput) {
    return request<LocalidadDTO>(LOCALIDADES, { method: "POST", body: input });
  },

  update(id: string, input: LocalidadUpdate) {
    return request<LocalidadDTO>(localidadUrl(id), { method: "PATCH", body: input });
  },

  remove(id: string) {
    return request<{ message: string }>(localidadUrl(id), { method: "DELETE" });
  },
};
