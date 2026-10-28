export function ObservacionAviso({ texto }: { texto: string }) {
  return (
    <p className="flex items-start gap-1 text-xs text-amber-700">
      <span aria-hidden="true">⚠</span>
      <span>{texto}</span>
    </p>
  );
}
