export function BarraSessoes({ usadas, total }: { usadas: number; total: number }) {
  const pct = total ? Math.min(100, (usadas / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-vinho-fundo">
        <div className="h-full rounded-full bg-vinho-acao" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-xs tabular-nums text-vinho-muted">
        {usadas}/{total}
      </span>
    </div>
  );
}
