import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TareaChecklistItem } from "@/components/TareaChecklistItem";
import { PlanDiarioProvider } from "@/contexts/PlanDiarioContext";
import { useAuth } from "@/hooks/useAuth";
import { apiClient, ApiError } from "@/lib/apiClient";
import { EstadoTarea } from "@/types";

function renderConProvider(ui: React.ReactElement) {
  return render(<PlanDiarioProvider>{ui}</PlanDiarioProvider>);
}

jest.mock("@/lib/apiClient", () => {
  const actual = jest.requireActual("@/lib/apiClient");
  return { ...actual, apiClient: { post: jest.fn() } };
});

jest.mock("@/hooks/useAuth");
const mockUseAuth = useAuth as jest.Mock;

const estadoTarea: EstadoTarea = {
  tipo_tarea_id: 3,
  tipo_tarea_nombre: "ACEITE",
  periodicidad_dias: 30,
  fecha_ultimo_registro: null,
  usuario_ultimo_registro: null,
  estado: "sin_registro",
};

describe("TareaChecklistItem", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      usuario: { id: 1, email: "t@t.com", nombre: "T", rol: "tecnico", activo: true },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    (apiClient.post as jest.Mock).mockClear();
    window.localStorage.clear();
  });

  it("envía el payload correcto al marcar la tarea como realizada", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ id: 1 });
    const onRegistrado = jest.fn();
    const user = userEvent.setup();

    renderConProvider(
      <TareaChecklistItem
        equipoId={7}
        equipoCodigo="1002"
        estadoTarea={estadoTarea}
        onRegistrado={onRegistrado}
        onEquipoActualizado={jest.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText("Observaciones"), "cambio de filtro");
    await user.click(screen.getByRole("button", { name: "Marcar realizado" }));

    await waitFor(() => expect(onRegistrado).toHaveBeenCalled());

    expect(apiClient.post).toHaveBeenCalledWith("/registros", {
      equipo_id: 7,
      tipo_tarea_id: 3,
      fecha_realizada: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      observaciones: "cambio de filtro",
      horas_trabajo: null,
      kilometros: null,
    });
  });

  it("envía horas trabajadas y kilómetros cuando se rellenan", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ id: 1 });
    const onRegistrado = jest.fn();
    const user = userEvent.setup();

    renderConProvider(
      <TareaChecklistItem
        equipoId={7}
        equipoCodigo="1002"
        estadoTarea={estadoTarea}
        onRegistrado={onRegistrado}
        onEquipoActualizado={jest.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText("Horas"), "1200");
    await user.type(screen.getByPlaceholderText("Km"), "85000");
    await user.click(screen.getByRole("button", { name: "Marcar realizado" }));

    await waitFor(() => expect(onRegistrado).toHaveBeenCalled());

    expect(apiClient.post).toHaveBeenCalledWith(
      "/registros",
      expect.objectContaining({ horas_trabajo: 1200, kilometros: 85000 }),
    );
  });

  it("muestra el error de la API si el registro falla", async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(
      new ApiError(404, "Equipo no encontrado"),
    );
    const onRegistrado = jest.fn();
    const user = userEvent.setup();

    renderConProvider(
      <TareaChecklistItem
        equipoId={7}
        equipoCodigo="1002"
        estadoTarea={estadoTarea}
        onRegistrado={onRegistrado}
        onEquipoActualizado={jest.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Marcar realizado" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Equipo no encontrado");
    expect(onRegistrado).not.toHaveBeenCalled();
  });

  it("muestra quién hizo el último registro", () => {
    renderConProvider(
      <TareaChecklistItem
        equipoId={7}
        equipoCodigo="1002"
        estadoTarea={{
          ...estadoTarea,
          fecha_ultimo_registro: "2026-09-01",
          usuario_ultimo_registro: "Ana",
        }}
        onRegistrado={jest.fn()}
        onEquipoActualizado={jest.fn()}
      />,
    );

    expect(screen.getByText("Último: 2026-09-01 — Ana")).toBeInTheDocument();
  });

  it("no muestra el selector de estado del vehículo a un técnico", () => {
    renderConProvider(
      <TareaChecklistItem
        equipoId={7}
        equipoCodigo="1002"
        estadoTarea={estadoTarea}
        onRegistrado={jest.fn()}
        onEquipoActualizado={jest.fn()}
      />,
    );

    expect(
      screen.queryByTitle("Cambiar estado del vehículo al registrar"),
    ).not.toBeInTheDocument();
  });

  it("cambia el estado del vehículo si un supervisor elige uno al marcar realizado", async () => {
    mockUseAuth.mockReturnValue({
      usuario: { id: 1, email: "s@s.com", nombre: "S", rol: "supervisor", activo: true },
    });
    (apiClient.post as jest.Mock).mockResolvedValue({ id: 1 });
    const onEquipoActualizado = jest.fn();
    const user = userEvent.setup();

    renderConProvider(
      <TareaChecklistItem
        equipoId={7}
        equipoCodigo="1002"
        estadoTarea={estadoTarea}
        onRegistrado={jest.fn()}
        onEquipoActualizado={onEquipoActualizado}
      />,
    );

    const select = screen.getByTitle("Cambiar estado del vehículo al registrar");
    await user.selectOptions(select, "averiado");
    await user.type(screen.getByPlaceholderText("Observaciones"), "tornillo suelto");
    await user.click(screen.getByRole("button", { name: "Marcar realizado" }));

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith("/equipos/7/estado", {
        estado_nuevo: "averiado",
        motivo: "tornillo suelto",
      }),
    );
    await waitFor(() => expect(onEquipoActualizado).toHaveBeenCalled());
  });

  it("no ofrece 'Activo' como opción, para no reactivar el vehículo sin querer", () => {
    mockUseAuth.mockReturnValue({
      usuario: { id: 1, email: "s@s.com", nombre: "S", rol: "supervisor", activo: true },
    });

    renderConProvider(
      <TareaChecklistItem
        equipoId={7}
        equipoCodigo="1002"
        estadoTarea={estadoTarea}
        onRegistrado={jest.fn()}
        onEquipoActualizado={jest.fn()}
      />,
    );

    const select = screen.getByTitle("Cambiar estado del vehículo al registrar");
    const opciones = [...select.querySelectorAll("option")].map((o) => o.value);
    expect(opciones).toEqual(["", "taller", "averiado", "baja"]);
  });

  it("añade la tarea a la lista del día sin llamar a la API", async () => {
    const onRegistrado = jest.fn();
    const user = userEvent.setup();

    renderConProvider(
      <TareaChecklistItem
        equipoId={7}
        equipoCodigo="1002"
        estadoTarea={estadoTarea}
        onRegistrado={onRegistrado}
        onEquipoActualizado={jest.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "+ Lista del día" }));

    expect(apiClient.post).not.toHaveBeenCalled();
    expect(JSON.parse(window.localStorage.getItem(`lote:plan-diario:${new Date().toISOString().slice(0, 10)}`) ?? "[]")).toEqual([
      expect.objectContaining({ equipoId: 7, equipoCodigo: "1002", tipoTareaId: 3, hecho: false }),
    ]);
  });
});
