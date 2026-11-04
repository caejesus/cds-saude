"use client";
import { useState } from "react";
import { FileText } from "lucide-react";
import type { jsPDF } from "jspdf";
import { PdfPreviewModal, usePdfPreview } from "./PdfPreview";

/** Botão que gera um PDF sob demanda e abre a pré-visualização. */
export function BotaoPdf({ gerar, nome, titulo, rotulo = "Gerar PDF", className = "botao-sec" }: {
  gerar: () => Promise<jsPDF>;
  nome: string;
  titulo: string;
  rotulo?: string;
  className?: string;
}) {
  const { pdf, abrir, fechar } = usePdfPreview();
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");

  async function clicar() {
    setErro("");
    setGerando(true);
    try {
      abrir(await gerar(), nome, titulo);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível gerar o PDF.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <>
      <button type="button" onClick={clicar} disabled={gerando} className={className}>
        <FileText size={16} /> {gerando ? "Gerando..." : rotulo}
      </button>
      {erro && <span className="text-xs text-red-700">{erro}</span>}
      <PdfPreviewModal pdf={pdf} onFechar={fechar} />
    </>
  );
}
