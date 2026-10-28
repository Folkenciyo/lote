import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CompartirEquipo } from "@/components/CompartirEquipo";
import { apiClient, ApiError } from "@/lib/apiClient";
import { Equipo } from "@/types";

jest.mock("@/lib/apiClient", () => {
  const actual = jest.requireActual("@/lib/apiClient");
  return { ...actual, apiClient: { post: jest.fn() } };
});

const equipo: Equipo = {
  id: 7,
  codigo: "1150",
  activo: true,
  marca: null,
  modelo: null,
  tipo: null,
  observaciones: null,
  estado_operativo: "averiado",
  lectura_actual_horas: null,
  lectura_actual_km: null,
  creado_por_id: null,
  creado_por_nombre: null,
};

const enlace = { token: "tok123", expira: "2026-11-04T18:00:00Z" };

describe("CompartirEquipo", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    (apiClient.post as jest.Mock).mockReset();
    delete (navigator as Partial<Navigator>).canShare;
    delete (navigator as Partial<Navigator>).share;
  });

  it("envía por WhatsApp el resumen con el enlace público", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue(enlace);
    const ventana = { location: { href: "" }, opener: {}, close: jest.fn() };
    jest.spyOn(window, "open").mockReturnValue(ventana as unknown as Window);
    const user = userEvent.setup();

    render(<CompartirEquipo equipo={equipo} estados={[]} />);
    await user.click(screen.getByRole("button", { name: /WhatsApp/ }));

    await waitFor(() => expect(ventana.location.href).toContain("https://wa.me/?text="));
    expect(apiClient.post).toHaveBeenCalledWith("/compartir/equipo/7");
    const texto = decodeURIComponent(ventana.location.href.split("text=")[1]);
    expect(texto).toContain("Equipo 1150 — Averiado");
    expect(texto).toContain(`${window.location.origin}/p/tok123`);
    expect(ventana.opener).toBeNull();
  });

  it("cierra la pestaña y muestra el error si no se puede crear el enlace", async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new ApiError(500, "Error del servidor"));
    const ventana = { location: { href: "" }, opener: {}, close: jest.fn() };
    jest.spyOn(window, "open").mockReturnValue(ventana as unknown as Window);
    const user = userEvent.setup();

    render(<CompartirEquipo equipo={equipo} estados={[]} />);
    await user.click(screen.getByRole("button", { name: /WhatsApp/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Error del servidor");
    expect(ventana.close).toHaveBeenCalled();
  });

  it("no muestra 'Enviar PDF' si el navegador no puede compartir archivos", () => {
    render(<CompartirEquipo equipo={equipo} estados={[]} />);

    expect(screen.queryByRole("button", { name: /Enviar PDF/ })).not.toBeInTheDocument();
  });

  it("adjunta el PDF y el mensaje con el menú de compartir del sistema", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue(enlace);
    const share = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { canShare: () => true, share });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["%PDF"], { type: "application/pdf" })),
    });
    const user = userEvent.setup();

    render(<CompartirEquipo equipo={equipo} estados={[]} />);
    await user.click(await screen.findByRole("button", { name: /Enviar PDF/ }));

    await waitFor(() => expect(share).toHaveBeenCalled());
    const datos = share.mock.calls[0][0];
    expect(datos.files[0].name).toBe("equipo-1150.pdf");
    expect(datos.files[0].type).toBe("application/pdf");
    expect(datos.text).toContain("/p/tok123");
    expect(global.fetch).toHaveBeenCalledWith("/api/exportaciones/equipo/7.pdf");
  });

  it("si el navegador bloquea el envío tras descargar, pide un segundo toque", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue(enlace);
    const share = jest
      .fn()
      .mockRejectedValueOnce(new DOMException("sin gesto", "NotAllowedError"))
      .mockResolvedValueOnce(undefined);
    Object.assign(navigator, { canShare: () => true, share });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["%PDF"], { type: "application/pdf" })),
    });
    const user = userEvent.setup();

    render(<CompartirEquipo equipo={equipo} estados={[]} />);
    await user.click(await screen.findByRole("button", { name: /Enviar PDF/ }));
    await user.click(await screen.findByRole("button", { name: /PDF listo — pulsa para enviar/ }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(2));
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Enviar PDF/ })).toBeInTheDocument();
  });
});
