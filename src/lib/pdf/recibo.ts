import { A4, brlPdf, limpar, MARGEM, novoDocumento, numeroLancamento, rgb, UTIL, type ClinicaPdf } from "./base";
import { valorPorExtenso } from "@/lib/extenso";

export type DadosReciboPdf = {
  clinica: ClinicaPdf;
  numero: number | null;
  valor: number;
  cliente: string;
  cpf: string | null;
  referente: string;
  forma: string | null;
  dataPagamento: string; // "4 de novembro de 2026"
  emitidoPor: string;
  emitidoEm: string; // "04/11/2026 às 17:10"
};

type Doc = Awaited<ReturnType<typeof novoDocumento>>;

/** Uma via do recibo, ocupando metade da folha a partir de y0. */
function via(doc: Doc, d: DadosReciboPdf, y0: number, rotuloVia: string) {
  const cor = rgb(d.clinica.corPrimaria);
  const xFim = MARGEM + UTIL;
  let y = y0 + 14;

  // Cabeçalho compacto
  if (d.clinica.logo) {
    try {
      const p = doc.getImageProperties(d.clinica.logo);
      const h = 11;
      doc.addImage(d.clinica.logo, MARGEM, y - 7, Math.min(45, (p.width / p.height) * h), h);
    } catch {
      /* sem logo */
    }
  } else {
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...cor);
    doc.text(limpar(d.clinica.marca), MARGEM, y);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  const info = [
    [d.clinica.nome, d.clinica.cnpj ? `CNPJ ${d.clinica.cnpj}` : null].filter(Boolean).join("  ·  "),
    [d.clinica.endereco, [d.clinica.cidade, d.clinica.estado].filter(Boolean).join("/"), d.clinica.telefone].filter(Boolean).join("  ·  "),
  ].filter(Boolean);
  info.forEach((l, i) => doc.text(limpar(l), xFim, y - 4 + i * 3.6, { align: "right" }));

  y += 6;
  doc.setDrawColor(...cor);
  doc.setLineWidth(0.5);
  doc.line(MARGEM, y, xFim, y);

  // Título + valor em destaque
  y += 11;
  doc.setTextColor(30, 30, 30);
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.text("RECIBO", MARGEM, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Nº ${numeroLancamento(d.numero)}`, MARGEM + 31, y);
  doc.setDrawColor(...cor);
  doc.setFillColor(250, 246, 248);
  doc.roundedRect(xFim - 55, y - 8, 55, 12, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...cor);
  doc.text(brlPdf(d.valor), xFim - 27.5, y, { align: "center" });

  // Corpo
  y += 13;
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const corpo =
    `Recebemos de ${d.cliente}${d.cpf ? `, CPF ${d.cpf}` : ""}, a importância de ${brlPdf(d.valor)} ` +
    `(${valorPorExtenso(d.valor)}), referente a ${d.referente}${d.forma ? `, paga via ${d.forma}` : ""}.`;
  const linhas: string[] = doc.splitTextToSize(limpar(corpo), UTIL);
  linhas.forEach((l, i) => {
    doc.text(l, MARGEM, y, i < linhas.length - 1 ? { align: "justify", maxWidth: UTIL } : undefined);
    y += 6;
  });
  y += 2;
  doc.text(limpar(`${[d.clinica.cidade, d.clinica.estado].filter(Boolean).join("/") || ""}${d.clinica.cidade ? ", " : ""}${d.dataPagamento}.`), MARGEM, y);

  // Assinatura
  const yAss = y0 + 92;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(A4.largura / 2 - 45, yAss, A4.largura / 2 + 45, yAss);
  doc.setFontSize(9.5);
  doc.text(limpar(d.clinica.nome), A4.largura / 2, yAss + 4.5, { align: "center" });
  if (d.clinica.cnpj) {
    doc.setFontSize(8);
    doc.text(`CNPJ ${d.clinica.cnpj}`, A4.largura / 2, yAss + 8.5, { align: "center" });
  }

  // Rodapé da via
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(limpar(`${rotuloVia}  ·  Emitido por ${d.emitidoPor} em ${d.emitidoEm}  ·  Este recibo não substitui a nota fiscal.`), MARGEM, y0 + 108);
  doc.setTextColor(30, 30, 30);
}

export async function gerarReciboPdf(d: DadosReciboPdf) {
  const doc = await novoDocumento();
  via(doc, d, 0, "Via do cliente");

  // Linha de recorte
  const meio = A4.altura / 2 + 3;
  doc.setDrawColor(170, 170, 170);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([2, 1.5], 0);
  doc.line(8, meio, A4.largura - 8, meio);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(6.5);
  doc.setTextColor(150, 150, 150);
  doc.text("recorte aqui", A4.largura / 2, meio - 1.2, { align: "center" });
  doc.setTextColor(30, 30, 30);

  via(doc, d, meio + 2, "Via da clínica");
  return doc;
}
