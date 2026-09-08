export interface PlanDiarioItem {
  id: string;
  equipoId: number;
  equipoCodigo: string;
  tipoTareaId: number;
  tipoTareaNombre: string;
  hecho: boolean;
}

function claveHoy(): string {
  const hoy = new Date().toISOString().slice(0, 10);
  return `lote:plan-diario:${hoy}`;
}

function idItem(equipoId: number, tipoTareaId: number): string {
  return `${equipoId}:${tipoTareaId}`;
}

export function leerPlanDia(): PlanDiarioItem[] {
  try {
    const raw = window.localStorage.getItem(claveHoy());
    return raw ? (JSON.parse(raw) as PlanDiarioItem[]) : [];
  } catch {
    return [];
  }
}

function guardarPlanDia(items: PlanDiarioItem[]): void {
  try {
    window.localStorage.setItem(claveHoy(), JSON.stringify(items));
  } catch {
    // localStorage no disponible (navegación privada, etc.) — la lista es
    // solo un recordatorio personal, no pasa nada si no persiste.
  }
}

export function agregarItemsPlanDia(
  nuevos: Array<Omit<PlanDiarioItem, "id" | "hecho">>
): PlanDiarioItem[] {
  const actuales = leerPlanDia();
  const existentes = new Set(actuales.map((item) => item.id));
  const items = [...actuales];
  for (const nuevo of nuevos) {
    const id = idItem(nuevo.equipoId, nuevo.tipoTareaId);
    if (!existentes.has(id)) {
      items.push({ ...nuevo, id, hecho: false });
      existentes.add(id);
    }
  }
  guardarPlanDia(items);
  return items;
}

export function alternarHechoPlanDia(id: string): PlanDiarioItem[] {
  const items = leerPlanDia().map((item) =>
    item.id === id ? { ...item, hecho: !item.hecho } : item
  );
  guardarPlanDia(items);
  return items;
}

export function quitarItemPlanDia(id: string): PlanDiarioItem[] {
  const items = leerPlanDia().filter((item) => item.id !== id);
  guardarPlanDia(items);
  return items;
}

export function limpiarHechasPlanDia(): PlanDiarioItem[] {
  const items = leerPlanDia().filter((item) => !item.hecho);
  guardarPlanDia(items);
  return items;
}
