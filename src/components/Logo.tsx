import { marca } from "@/lib/marca";

export function Logo({ claro = false }: { claro?: boolean }) {
  if (marca.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={marca.logo} alt={marca.nome} className="h-12 w-auto max-w-[180px] object-contain" />
    );
  }
  return (
    <div className="leading-none">
      <span className={`font-titulo text-3xl font-semibold ${claro ? "text-white" : "text-vinho-escuro"}`}>
        {marca.nome}
      </span>
      {marca.subtitulo && (
        <span className={`block text-[11px] uppercase tracking-[0.2em] ${claro ? "text-vinho-medio" : "text-vinho-muted"}`}>
          {marca.subtitulo}
        </span>
      )}
    </div>
  );
}
