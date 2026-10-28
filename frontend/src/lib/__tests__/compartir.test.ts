import { construirMensajeEquipo, formatearFecha } from "@/lib/compartir";
import { EstadoTarea } from "@/types";

const tarea = (parcial: Partial<EstadoTarea>): EstadoTarea => ({
  tipo_tarea_id: 1,
  tipo_tarea_nombre: "ACEITE",
  periodicidad_dias: 30,
  fecha_ultimo_registro: null,
  usuario_ultimo_registro: null,
  observaciones_ultimo_registro: null,
  estado: "al_dia",
  ...parcial,
});

const equipo = { codigo: "1150", marca: "Volvo", modelo: "FH16", estado_operativo: "averiado" as const };

describe("construirMensajeEquipo", () => {
  it("resume estado, tareas pendientes, última observación y el enlace", () => {
    const mensaje = construirMensajeEquipo(
      equipo,
      [
        tarea({ estado: "vencido", fecha_ultimo_registro: "2026-09-01", observaciones_ultimo_registro: "vieja" }),
        tarea({ tipo_tarea_id: 2, tipo_tarea_nombre: "GRUPO", estado: "vencido" }),
        tarea({
          tipo_tarea_id: 3,
          tipo_tarea_nombre: "ENGRASE",
          estado: "proximo_a_vencer",
          fecha_ultimo_registro: "2026-10-20",
          observaciones_ultimo_registro: "fuga en el cárter",
        }),
      ],
      "https://lote.fholk.com/p/abc",
      "2026-11-04T18:00:00Z"
    );

    expect(mensaje).toBe(
      [
        "Equipo 1150 — Averiado",
        "Volvo FH16",
        "⚠ 2 tareas vencidas · 1 próxima a vencer",
        "Última observación (ENGRASE, 20/10/2026): fuga en el cárter",
        "",
        "Ver estado y descargar PDF (enlace válido hasta el 04/11/2026):",
        "https://lote.fholk.com/p/abc",
      ].join("\n")
    );
  });

  it("indica que todo está al día y omite lo que no hay", () => {
    const mensaje = construirMensajeEquipo(
      { ...equipo, marca: null, modelo: null, estado_operativo: "activo" },
      [tarea({})],
      "https://x/p/t",
      "2026-11-04T18:00:00Z"
    );

    expect(mensaje).toBe(
      [
        "Equipo 1150 — Activo",
        "✓ Todas las tareas al día",
        "",
        "Ver estado y descargar PDF (enlace válido hasta el 04/11/2026):",
        "https://x/p/t",
      ].join("\n")
    );
  });
});

describe("formatearFecha", () => {
  it("convierte yyyy-mm-dd a dd/mm/yyyy", () => {
    expect(formatearFecha("2026-03-05")).toBe("05/03/2026");
  });
});
