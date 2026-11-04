"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, PenLine } from "lucide-react";
import { AssinaturaTelaCheia } from "@/components/AreaAssinatura";
import { gerarTermoPdf } from "@/lib/pdf/termo";
import { imagemComoDataUrl } from "@/lib/pdf/base";
import { marca } from "@/lib/marca";
import type { TermoPublico } from "@/lib/supabase/publico";
import { enviarAssinaturaLink } from "./actions";

export function Assinar({ token, termo, assinadoEm, cpf }: { token: string; termo: TermoPublico; assinadoEm: string | null; cpf: string | null }) {
  const router = useRouter();
  const [concordo, setConcordo] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const titulo = `Termo de Consentimento${termo.procedimento ? ` · ${termo.procedimento}` : ""}`;

  async function baixar() {
    setBaixando(true);
    const logo = await imagemComoDataUrl(marca.logo || null);
    const doc = await gerarTermoPdf({
      clinica: { ...termo.clinica, marca: marca.nome, subtitulo: marca.subtitulo, corPrimaria: marca.corPrimaria, logo },
      titulo,
      texto: termo.texto,
      cliente: termo.cliente,
      cpf,
      assinatura: termo.assinatura,
      assinadoEm,
      codigo: termo.id.slice(0, 8).toUpperCase(),
    });
    doc.save(`termo-${termo.id.slice(0, 8)}.pdf`);
    setBaixando(false);
  }

  if (termo.aceito_em) {
    return (
      <div className="space-y-4 rounded-2xl bg-green-50 p-6 text-center">
        <CheckCircle2 size={48} className="mx-auto text-green-700" />
        <p className="font-titulo text-2xl font-semibold text-green-900">Termo assinado</p>
        <p className="text-sm text-green-900">Obrigado, {termo.cliente.split(" ")[0]}! A {termo.clinica.nome} já recebeu sua assinatura{assinadoEm ? ` (${assinadoEm})` : ""}.</p>
        <button type="button" onClick={baixar} disabled={baixando} className="botao mx-auto">
          <Download size={16} /> {baixando ? "Gerando..." : "Baixar minha cópia (PDF)"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 rounded-xl border border-vinho-borda bg-white p-4 text-sm">
        <input type="checkbox" checked={concordo} onChange={(e) => setConcordo(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-vinho-acao" />
        <span>Li todo o termo acima, tive minhas dúvidas esclarecidas e concordo com o que está descrito.</span>
      </label>
      <button type="button" disabled={!concordo} onClick={() => setAberto(true)} className="botao w-full py-3 text-base">
        <PenLine size={18} /> Assinar
      </button>
      <AssinaturaTelaCheia
        aberto={aberto}
        nome={termo.cliente}
        onFechar={() => setAberto(false)}
        onEnviar={async (png) => {
          const erro = await enviarAssinaturaLink(token, png);
          if (erro) return erro;
          setAberto(false);
          router.refresh();
        }}
      />
    </div>
  );
}
