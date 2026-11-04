"use client";
import { useCallback, useEffect, useState } from "react";
import { Download, Printer, X } from "lucide-react";
import type { jsPDF } from "jspdf";

type Estado = { url: string; nome: string; titulo: string } | null;

/** Pré-visualização de PDF com Imprimir / Baixar / Fechar (mesma lógica do sistema da funerária). */
export function usePdfPreview() {
  const [pdf, setPdf] = useState<Estado>(null);

  const abrir = useCallback((doc: jsPDF, nome: string, titulo: string) => {
    const url = URL.createObjectURL(doc.output("blob"));
    setPdf((antes) => {
      if (antes) URL.revokeObjectURL(antes.url);
      return { url, nome, titulo };
    });
  }, []);

  const fechar = useCallback(() => {
    setPdf((antes) => {
      if (antes) URL.revokeObjectURL(antes.url);
      return null;
    });
  }, []);

  return { pdf, abrir, fechar };
}

export function PdfPreviewModal({ pdf, onFechar }: { pdf: Estado; onFechar: () => void }) {
  useEffect(() => {
    if (!pdf) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [pdf, onFechar]);

  if (!pdf) return null;

  function imprimir() {
    if (!pdf) return;
    // Abre o PDF numa aba própria e imprime de lá: sai o documento, não a tela do sistema.
    const janela = window.open(pdf.url, "_blank");
    if (!janela) return baixar();
    janela.addEventListener("load", () => {
      janela.focus();
      janela.print();
    });
  }

  function baixar() {
    if (!pdf) return;
    const a = document.createElement("a");
    a.href = pdf.url;
    a.download = pdf.nome;
    a.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-6" role="dialog" aria-modal="true" aria-label={pdf.titulo}>
      <div className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-vinho-borda px-4 py-3">
          <h3 className="font-titulo text-lg font-semibold">{pdf.titulo}</h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={imprimir} className="botao-sec py-1.5"><Printer size={16} /> Imprimir</button>
            <button type="button" onClick={baixar} className="botao py-1.5"><Download size={16} /> Baixar PDF</button>
            <button type="button" onClick={onFechar} className="botao-sec py-1.5 text-red-700" aria-label="Fechar"><X size={16} /> Fechar</button>
          </div>
        </div>
        <iframe src={pdf.url} title={pdf.titulo} className="w-full flex-1 bg-gray-100" />
        <p className="border-t border-vinho-borda px-4 py-2 text-center text-xs text-vinho-muted sm:hidden">
          Se a prévia não aparecer no celular, use &quot;Baixar PDF&quot;.
        </p>
      </div>
    </div>
  );
}
