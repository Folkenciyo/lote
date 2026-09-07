import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TareaChecklistItem } from "@/components/TareaChecklistItem";
import { apiClient, ApiError } from "@/lib/apiClient";
import { EstadoTarea } from "@/types";

jest.mock("@/lib/apiClient", () => {
  const actual = jest.requireActual("@/lib/apiClient");
  return { ...actual, apiClient: { post: jest.fn() } };
});

const estadoTarea: EstadoTarea = {
  tipo_tarea_id: 3,
  tipo_tarea_nombre: "ACEITE",
  periodicidad_dias: 30,
  fecha_ultimo_registro: null,
  estado: "sin_registro",
};

describe("TareaChecklistItem", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("envía el payload correcto al marcar la tarea como realizada", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ id: 1 });
    const onRegistrado = jest.fn();
    const user = userEvent.setup();

    render(
      <TareaChecklistItem equipoId={7} estadoTarea={estadoTarea} onRegistrado={onRegistrado} />,
    );

    await user.type(screen.getByPlaceholderText("Observaciones"), "cambio de filtro");
    await user.click(screen.getByRole("button", { name: "Marcar realizado" }));

    await waitFor(() => expect(onRegistrado).toHaveBeenCalled());

    expect(apiClient.post).toHaveBeenCalledWith("/registros", {
      equipo_id: 7,
      tipo_tarea_id: 3,
      fecha_realizada: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      observaciones: "cambio de filtro",
    });
  });

  it("muestra el error de la API si el registro falla", async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(
      new ApiError(404, "Equipo no encontrado"),
    );
    const onRegistrado = jest.fn();
    const user = userEvent.setup();

    render(
      <TareaChecklistItem equipoId={7} estadoTarea={estadoTarea} onRegistrado={onRegistrado} />,
    );

    await user.click(screen.getByRole("button", { name: "Marcar realizado" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Equipo no encontrado");
    expect(onRegistrado).not.toHaveBeenCalled();
  });
});
