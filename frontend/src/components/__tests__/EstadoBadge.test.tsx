import { render, screen } from "@testing-library/react";

import { EstadoBadge } from "@/components/EstadoBadge";
import { Estado } from "@/types";

describe("EstadoBadge", () => {
  const casos: Array<[Estado, string, string]> = [
    ["al_dia", "Al día", "bg-green-100"],
    ["proximo_a_vencer", "Próximo a vencer", "bg-yellow-100"],
    ["vencido", "Vencido", "bg-red-100"],
    ["sin_registro", "Sin registro", "bg-gray-100"],
  ];

  it.each(casos)("muestra el texto y color correctos para %s", (estado, texto, claseColor) => {
    render(<EstadoBadge estado={estado} />);
    const badge = screen.getByTestId("estado-badge");
    expect(badge).toHaveTextContent(texto);
    expect(badge.className).toContain(claseColor);
  });
});
