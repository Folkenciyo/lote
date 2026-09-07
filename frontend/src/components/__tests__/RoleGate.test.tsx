import { render, screen } from "@testing-library/react";

import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/useAuth";

jest.mock("@/hooks/useAuth");

const mockUseAuth = useAuth as jest.Mock;

describe("RoleGate", () => {
  it("oculta el contenido cuando el usuario es técnico", () => {
    mockUseAuth.mockReturnValue({
      usuario: { id: 1, email: "t@t.com", nombre: "T", rol: "tecnico", activo: true },
    });

    render(
      <RoleGate rol="supervisor">
        <p>Solo supervisores</p>
      </RoleGate>,
    );

    expect(screen.queryByText("Solo supervisores")).not.toBeInTheDocument();
  });

  it("muestra el contenido cuando el usuario tiene el rol requerido", () => {
    mockUseAuth.mockReturnValue({
      usuario: { id: 1, email: "s@s.com", nombre: "S", rol: "supervisor", activo: true },
    });

    render(
      <RoleGate rol="supervisor">
        <p>Solo supervisores</p>
      </RoleGate>,
    );

    expect(screen.getByText("Solo supervisores")).toBeInTheDocument();
  });

  it("oculta el contenido cuando no hay usuario autenticado", () => {
    mockUseAuth.mockReturnValue({ usuario: null });

    render(
      <RoleGate rol="supervisor">
        <p>Solo supervisores</p>
      </RoleGate>,
    );

    expect(screen.queryByText("Solo supervisores")).not.toBeInTheDocument();
  });
});
