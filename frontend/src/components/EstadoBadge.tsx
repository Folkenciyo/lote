import { Estado } from "@/types";

const CONFIG: Record<Estado, { texto: string; clase: string }> = {
  al_dia: { texto: "Al día", clase: "bg-green-100 text-green-800" },
  proximo_a_vencer: { texto: "Próximo a vencer", clase: "bg-yellow-100 text-yellow-800" },
  vencido: { texto: "Vencido", clase: "bg-red-100 text-red-800" },
  sin_registro: { texto: "Sin registro", clase: "bg-gray-100 text-gray-600" },
};

export function EstadoBadge({ estado }: { estado: Estado }) {
  const { texto, clase } = CONFIG[estado];
  return (
    <span
      data-testid="estado-badge"
      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${clase}`}
    >
      {texto}
    </span>
  );
}
