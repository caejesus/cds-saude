"use client";
import { BotaoPdf } from "@/components/pdf/BotaoPdf";
import { imagemComoDataUrl } from "@/lib/pdf/base";
import { gerarMovimentosPdf, type DadosMovimentosPdf } from "@/lib/pdf/movimentos";
import { marca } from "@/lib/marca";

export function PdfMovimentos(d: DadosMovimentosPdf & { arquivo: string }) {
  return (
    <BotaoPdf
      rotulo="PDF"
      titulo={`Movimentações · ${d.periodo}`}
      nome={d.arquivo}
      className="botao-sec py-1 text-xs"
      gerar={async () => {
        const logo = await imagemComoDataUrl(marca.logo || null);
        return gerarMovimentosPdf({ ...d, clinica: { ...d.clinica, logo } });
      }}
    />
  );
}
