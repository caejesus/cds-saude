export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <div className="leading-none">
      <span className={`font-titulo text-3xl font-semibold ${claro ? "text-white" : "text-vinho-escuro"}`}>
        CDS
      </span>
      <span className={`block text-[11px] uppercase tracking-[0.2em] ${claro ? "text-vinho-medio" : "text-vinho-muted"}`}>
        gestão em saúde
      </span>
    </div>
  );
}
