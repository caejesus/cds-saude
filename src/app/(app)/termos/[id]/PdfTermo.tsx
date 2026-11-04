"use client";
import { BotaoPdf } from "@/components/pdf/BotaoPdf";
import { imagemComoDataUrl, type ClinicaPdf } from "@/lib/pdf/base";
import { gerarTermoPdf } from "@/lib/pdf/termo";
import { marca } from "@/lib/marca";

export function PdfTermo(p: {
  clinica: ClinicaPdf;
  titulo: string;
  texto: string;
  cliente: string;
  cpf: string | null;
  assinaturaUrl: string | null;
  assinadoEm: string | null;
  registro?: string | null;
  codigo: string;
}) {
  return (
    <BotaoPdf
      rotulo="Imprimir / PDF"
      titulo="Termo de consentimento"
      nome={`termo-${p.cliente.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${p.codigo}.pdf`}
      gerar={async () => {
        const [assinatura, logo] = await Promise.all([
          p.assinaturaUrl?.startsWith("data:") ? Promise.resolve(p.assinaturaUrl) : imagemComoDataUrl(p.assinaturaUrl),
          imagemComoDataUrl(marca.logo || null),
        ]);
        return gerarTermoPdf({ ...p, clinica: { ...p.clinica, logo }, assinatura });
      }}
    />
  );
}
