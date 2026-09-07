export function MetricCard({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-lg border border-black/10 p-4">
      <p className="text-sm text-black/60">{titulo}</p>
      <p className="text-2xl font-semibold">{valor}</p>
    </div>
  );
}
