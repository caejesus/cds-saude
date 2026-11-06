"use client";
import { BotaoPdf } from "@/components/pdf/BotaoPdf";
import { imagemComoDataUrl } from "@/lib/pdf/base";
import { gerarCaixaPdf, type DadosCaixaPdf } from "@/lib/pdf/caixa";
import { marca } from "@/lib/marca";

export function PdfCaixa(d: DadosCaixaPdf & { arquivo: string }) {
  return (
    <BotaoPdf
      rotulo="Imprimir"
      titulo={`Fechamento de caixa · ${d.data}`}
      nome={d.arquivo}
      className="botao-sec py-1.5"
      gerar={async () => {
        const logo = await imagemComoDataUrl(d.clinica.logoUrl || marca.logo || null);
        return gerarCaixaPdf({ ...d, clinica: { ...d.clinica, logo } });
      }}
    />
  );
}
