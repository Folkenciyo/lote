import { ReactNode } from "react";

const TONOS = {
  neutro: "bg-primary/10 text-primary",
  rojo: "bg-red-100 text-red-700",
  ambar: "bg-amber-100 text-amber-700",
} as const;

export function MetricCard({
  titulo,
  valor,
  icono,
  tono = "neutro",
}: {
  titulo: string;
  valor: string | number;
  icono?: ReactNode;
  tono?: keyof typeof TONOS;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-card-border bg-card p-5 shadow-sm">
      {icono && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${TONOS[tono]}`}>
          {icono}
        </div>
      )}
      <div>
        <p className="text-sm text-muted">{titulo}</p>
        <p className="text-2xl font-semibold text-foreground">{valor}</p>
      </div>
    </div>
  );
}
