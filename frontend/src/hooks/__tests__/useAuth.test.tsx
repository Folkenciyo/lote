import { renderHook, waitFor } from "@testing-library/react";

import { useAuth } from "@/hooks/useAuth";
import { apiClient, ApiError } from "@/lib/apiClient";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/apiClient", () => {
  const actual = jest.requireActual("@/lib/apiClient");
  return { ...actual, apiClient: { get: jest.fn() } };
});

describe("useAuth", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("token expirado: deja al usuario como no autenticado sin lanzar", async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new ApiError(401, "No autenticado"));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.usuario).toBeNull();
  });

  it("usuario válido: expone los datos del usuario autenticado", async () => {
    const usuario = { id: 1, email: "a@a.com", nombre: "A", rol: "tecnico", activo: true };
    (apiClient.get as jest.Mock).mockResolvedValue(usuario);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.usuario).toEqual(usuario);
  });
});
