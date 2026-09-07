import { Estado } from "@/types";

const CONFIG: Record<Estado, { texto: string; clase: string; punto: string }> = {
  al_dia: { texto: "Al día", clase: "bg-green-100 text-green-800", punto: "bg-green-500" },
  proximo_a_vencer: {
    texto: "Próximo a vencer",
    clase: "bg-yellow-100 text-yellow-800",
    punto: "bg-yellow-500",
  },
  vencido: { texto: "Vencido", clase: "bg-red-100 text-red-800", punto: "bg-red-500" },
  sin_registro: { texto: "Sin registro", clase: "bg-gray-100 text-gray-600", punto: "bg-gray-400" },
};

export function EstadoBadge({ estado }: { estado: Estado }) {
  const { texto, clase, punto } = CONFIG[estado];
  return (
    <span
      data-testid="estado-badge"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${clase}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${punto}`} />
      {texto}
    </span>
  );
}
