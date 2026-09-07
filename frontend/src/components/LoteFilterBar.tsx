const LOTES = Array.from({ length: 21 }, (_, i) => i + 1);

export function LoteFilterBar({
  loteSeleccionado,
  onCambiarLote,
}: {
  loteSeleccionado: number | undefined;
  onCambiarLote: (lote: number | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onCambiarLote(undefined)}
        className={`rounded px-3 py-1 text-sm ${
          loteSeleccionado === undefined ? "bg-black text-white" : "bg-black/5"
        }`}
      >
        Todos
      </button>
      {LOTES.map((lote) => (
        <button
          key={lote}
          onClick={() => onCambiarLote(lote)}
          className={`rounded px-3 py-1 text-sm ${
            loteSeleccionado === lote ? "bg-black text-white" : "bg-black/5"
          }`}
        >
          Lote {lote}
        </button>
      ))}
    </div>
  );
}
