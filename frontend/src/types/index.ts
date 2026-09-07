export type Rol = "tecnico" | "supervisor";

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
}

export interface Equipo {
  id: number;
  codigo: string;
  lote: number;
  activo: boolean;
  marca: string | null;
  modelo: string | null;
  tipo: string | null;
}

export type Estado = "sin_registro" | "vencido" | "proximo_a_vencer" | "al_dia";

export interface EstadoTarea {
  tipo_tarea_id: number;
  tipo_tarea_nombre: string;
  periodicidad_dias: number;
  fecha_ultimo_registro: string | null;
  estado: Estado;
}

export interface ResumenLote {
  lote: number;
  total_equipos: number;
  total_pares: number;
  vencidos: number;
  proximos_a_vencer: number;
  sin_registro: number;
  porcentaje_cumplimiento: number;
}

export interface DashboardResumen {
  total_equipos: number;
  total_vencidos: number;
  total_proximos_a_vencer: number;
  por_lote: ResumenLote[];
}

export interface RegistroCreate {
  equipo_id: number;
  tipo_tarea_id: number;
  fecha_realizada: string;
  observaciones?: string | null;
}

export interface Registro {
  id: number;
  equipo_id: number;
  tipo_tarea_id: number;
  tipo_tarea_nombre: string;
  usuario_id: number;
  usuario_nombre: string;
  fecha_realizada: string;
  observaciones: string | null;
}

export interface ActividadUsuario {
  usuario_id: number;
  nombre: string;
  total_registros: number;
  ultimo_registro: string | null;
}
