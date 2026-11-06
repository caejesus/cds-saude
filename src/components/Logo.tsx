import { marca } from "@/lib/marca";

/** Logo da clínica: a enviada em Configurações (logoUrl) ou a do deploy; sem logo, o nome. */
export function Logo({ claro = false, logoUrl }: { claro?: boolean; logoUrl?: string | null }) {
  const src = logoUrl || marca.logo;
  if (src) {
    return (
      <span className={claro ? "inline-flex rounded-lg bg-white px-2.5 py-1.5" : "inline-flex"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={marca.nome} className="h-10 w-auto max-w-[160px] object-contain" />
      </span>
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
