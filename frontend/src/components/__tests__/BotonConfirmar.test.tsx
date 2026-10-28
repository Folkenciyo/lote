import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BotonConfirmar } from "@/components/BotonConfirmar";

describe("BotonConfirmar", () => {
  it("no ejecuta la acción hasta confirmar", async () => {
    const onConfirmar = jest.fn();
    const user = userEvent.setup();
    render(
      <BotonConfirmar
        texto="Vaciar lista"
        pregunta="¿Quitar las 3 tareas?"
        textoConfirmar="Sí, vaciar"
        onConfirmar={onConfirmar}
      />
    );

    await user.click(screen.getByRole("button", { name: "Vaciar lista" }));
    expect(onConfirmar).not.toHaveBeenCalled();
    expect(screen.getByText("¿Quitar las 3 tareas?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sí, vaciar" }));
    expect(onConfirmar).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Vaciar lista" })).toBeInTheDocument();
  });

  it("cancelar vuelve al botón sin ejecutar nada", async () => {
    const onConfirmar = jest.fn();
    const user = userEvent.setup();
    render(
      <BotonConfirmar texto="Quitar vehículo" pregunta="¿Seguro?" textoConfirmar="Sí" onConfirmar={onConfirmar} />
    );

    await user.click(screen.getByRole("button", { name: "Quitar vehículo" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onConfirmar).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Quitar vehículo" })).toBeInTheDocument();
  });
});
