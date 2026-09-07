const LOTES = Array.from({ length: 21 }, (_, i) => i + 1);

export function LoteFilterBar({
  loteSeleccionado,
  onCambiarLote,
}: {
  loteSeleccionado: number | undefined;
  onCambiarLote: (lote: number | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onCambiarLote(undefined)}
        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
          loteSeleccionado === undefined
            ? "bg-primary text-white"
            : "bg-card border border-card-border text-muted hover:text-foreground"
        }`}
      >
        Todos
      </button>
      {LOTES.map((lote) => (
        <button
          key={lote}
          onClick={() => onCambiarLote(lote)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            loteSeleccionado === lote
              ? "bg-primary text-white"
              : "bg-card border border-card-border text-muted hover:text-foreground"
          }`}
        >
          Lote {lote}
        </button>
      ))}
    </div>
  );
}
