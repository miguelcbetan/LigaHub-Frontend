import { request } from "./business-torneos";

export interface EscenarioDTO {
  id: string;
  nombre: string;
  direccion: string;
  capacidad: number;
}

export const businessEscenariosApi = {
  findAll() {
    return request<EscenarioDTO[]>("/api/business/escenarios");
  },
};
