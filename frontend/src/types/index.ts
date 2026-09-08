export type Rol = "tecnico" | "supervisor";

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
}

export type EstadoOperativo = "activo" | "taller" | "baja" | "averiado";

export interface Equipo {
  id: number;
  codigo: string;
  activo: boolean;
  marca: string | null;
  modelo: string | null;
  tipo: string | null;
  observaciones: string | null;
  estado_operativo: EstadoOperativo;
  lectura_actual_horas: number | null;
  lectura_actual_km: number | null;
  creado_por_id: number | null;
  creado_por_nombre: string | null;
}

export interface CambioEstadoEquipo {
  id: number;
  equipo_id: number;
  usuario_id: number;
  usuario_nombre: string;
  estado_anterior: EstadoOperativo;
  estado_nuevo: EstadoOperativo;
  motivo: string | null;
  created_at: string;
}

export type Estado = "sin_registro" | "vencido" | "proximo_a_vencer" | "al_dia";

export interface EstadoTarea {
  tipo_tarea_id: number;
  tipo_tarea_nombre: string;
  periodicidad_dias: number;
  fecha_ultimo_registro: string | null;
  usuario_ultimo_registro: string | null;
  estado: Estado;
}

export interface DashboardResumen {
  total_equipos: number;
  total_pares: number;
  total_vencidos: number;
  total_proximos_a_vencer: number;
  total_sin_registro: number;
  porcentaje_cumplimiento: number;
}

export interface RegistroCreate {
  equipo_id: number;
  tipo_tarea_id: number;
  fecha_realizada: string;
  observaciones?: string | null;
  horas_trabajo?: number | null;
  kilometros?: number | null;
}

export interface Registro {
  id: number;
  equipo_id: number;
  equipo_codigo: string;
  tipo_tarea_id: number;
  tipo_tarea_nombre: string;
  usuario_id: number;
  usuario_nombre: string;
  fecha_realizada: string;
  observaciones: string | null;
  horas_trabajo: number | null;
  kilometros: number | null;
}

export interface ActividadUsuario {
  usuario_id: number;
  nombre: string;
  total_registros: number;
  ultimo_registro: string | null;
}

export interface AvisoCategoria {
  total_vencidos: number;
  codigos_equipos: string[];
}

export interface Avisos {
  mantenimiento: AvisoCategoria;
  engrase: AvisoCategoria;
}

export type CategoriaTarea = "engrase" | "mantenimiento";

export interface TipoTarea {
  id: number;
  nombre: string;
  categoria: string;
  periodicidad_dias: number;
  limite_horas: number | null;
}

export interface TipoTareaCreate {
  nombre: string;
  categoria: CategoriaTarea;
  periodicidad_dias: number;
  limite_horas?: number | null;
}

export interface Elemento {
  id: number;
  equipo_id: number;
  nombre: string;
  referencia: string;
  observaciones: string | null;
}

export interface ElementoCreate {
  nombre: string;
  referencia: string;
  observaciones?: string | null;
}

export type ColorEtiqueta =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "gray";

export interface Etiqueta {
  id: number;
  nombre: string;
  estado_operativo: EstadoOperativo;
  color: ColorEtiqueta;
}

export interface EtiquetaCreate {
  nombre: string;
  estado_operativo: EstadoOperativo;
  color: ColorEtiqueta;
}

export interface EquipoEtiqueta {
  id: number;
  equipo_id: number;
  etiqueta: Etiqueta;
  usuario_id: number;
  usuario_nombre: string;
  created_at: string;
}
