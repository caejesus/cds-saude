"use client";
import { BotaoPdf } from "./BotaoPdf";
import { imagemComoDataUrl, type ClinicaPdf } from "@/lib/pdf/base";
import { gerarReciboPdf, type DadosReciboPdf } from "@/lib/pdf/recibo";
import { marca } from "@/lib/marca";

/** Gera o recibo (2 vias) de um pagamento recebido. */
export function BotaoRecibo({ clinica, className, ...d }: Omit<DadosReciboPdf, "clinica"> & { clinica: ClinicaPdf; className?: string }) {
  return (
    <BotaoPdf
      rotulo="Recibo"
      titulo={`Recibo nº ${d.numero ? String(d.numero).padStart(3, "0") : ""}`}
      nome={`recibo-${d.numero ? String(d.numero).padStart(3, "0") : "sn"}-${d.cliente.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-")}.pdf`}
      className={className ?? "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-vinho-fundo"}
      gerar={async () => {
        const logo = await imagemComoDataUrl(clinica.logoUrl || marca.logo || null);
        return gerarReciboPdf({ ...d, clinica: { ...clinica, logo } });
      }}
    />
  );
}
