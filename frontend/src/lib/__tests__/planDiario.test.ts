import {
  agregarItemsPlanDia,
  leerPlanDia,
  quitarEquipoPlanDia,
  vaciarPlanDia,
} from "@/lib/planDiario";

const item = (equipoId: number, tipoTareaId: number) => ({
  equipoId,
  equipoCodigo: String(1000 + equipoId),
  tipoTareaId,
  tipoTareaNombre: `T${tipoTareaId}`,
});

describe("planDiario: borrado masivo", () => {
  beforeEach(() => {
    window.localStorage.clear();
    agregarItemsPlanDia([item(1, 1), item(1, 2), item(2, 1)]);
  });

  it("quitarEquipoPlanDia quita todas las tareas de ese vehículo y deja las demás", () => {
    const restantes = quitarEquipoPlanDia(1);

    expect(restantes.map((i) => i.id)).toEqual(["2:1"]);
    expect(leerPlanDia()).toEqual(restantes);
  });

  it("vaciarPlanDia deja la lista vacía", () => {
    expect(vaciarPlanDia()).toEqual([]);
    expect(leerPlanDia()).toEqual([]);
  });
});
