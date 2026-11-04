import type { jsPDF } from "jspdf";

/**
 * Base dos documentos em PDF (A4, mm). Todo documento impresso do sistema usa estas
 * funções: cabeçalho da clínica, parágrafos com quebra de página e rodapé numerado.
 */
export const A4 = { largura: 210, altura: 297 };
export const MARGEM = 20;
export const UTIL = A4.largura - MARGEM * 2;

export type ClinicaPdf = {
  nome: string;
  marca: string;
  subtitulo?: string;
  cnpj?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  telefone?: string | null;
  corPrimaria: string;
  logo?: string | null; // dataURL
};

export async function novoDocumento() {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  doc.setTextColor(30, 30, 30);
  return doc;
}

export function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Troca caracteres que as fontes padrão do PDF não têm. */
export const limpar = (t: string) =>
  t.replace(/[−–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, "...");

/** Cabeçalho com logo (ou nome), dados da clínica e uma linha na cor da marca. Retorna o Y livre. */
export function cabecalho(doc: jsPDF, c: ClinicaPdf) {
  let y = 16;
  if (c.logo) {
    try {
      const p = doc.getImageProperties(c.logo);
      const h = 14;
      const w = Math.min(60, (p.width / p.height) * h);
      doc.addImage(c.logo, MARGEM, y - 4, w, h);
    } catch {
      /* logo inválida: segue com o nome */
    }
  }
  const xTexto = c.logo ? A4.largura - MARGEM : MARGEM;
  const alinhar = c.logo ? "right" : "left";
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...rgb(c.corPrimaria));
  if (!c.logo) doc.text(limpar(c.marca), xTexto, y + 2, { align: alinhar });
  doc.setTextColor(90, 90, 90);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const linhas = [
    [c.nome, c.cnpj ? `CNPJ ${c.cnpj}` : null].filter(Boolean).join("  ·  "),
    [c.endereco, [c.cidade, c.estado].filter(Boolean).join("/"), c.telefone].filter(Boolean).join("  ·  "),
  ].filter(Boolean);
  let yl = c.logo ? y : y + 7;
  for (const l of linhas) {
    doc.text(limpar(l), xTexto, yl, { align: alinhar });
    yl += 4;
  }
  y = Math.max(yl, y + 12);
  doc.setDrawColor(...rgb(c.corPrimaria));
  doc.setLineWidth(0.6);
  doc.line(MARGEM, y, A4.largura - MARGEM, y);
  doc.setTextColor(30, 30, 30);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  return y + 10;
}

export function titulo(doc: jsPDF, texto: string, y: number) {
  doc.setFont("times", "bold");
  doc.setFontSize(15);
  const linhas = doc.splitTextToSize(limpar(texto), UTIL);
  doc.text(linhas, A4.largura / 2, y, { align: "center" });
  return y + linhas.length * 6.5 + 4;
}

/**
 * Escreve um texto longo (com \n entre parágrafos) justificado, quebrando página
 * quando precisa. `aoQuebrar` redesenha o cabeçalho na página nova.
 */
export function paragrafos(doc: jsPDF, texto: string, y: number, aoQuebrar: () => number, tamanho = 11) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(tamanho);
  const altura = tamanho * 0.48;
  for (const p of limpar(texto).split(/\n\s*\n/)) {
    const linhas: string[] = doc.splitTextToSize(p.replace(/\n/g, " ").trim(), UTIL);
    linhas.forEach((l, i) => {
      if (y > A4.altura - 30) {
        doc.addPage();
        y = aoQuebrar();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(tamanho);
      }
      const ultima = i === linhas.length - 1;
      doc.text(l, MARGEM, y, ultima ? undefined : { align: "justify", maxWidth: UTIL });
      y += altura;
    });
    y += altura * 0.7;
  }
  return y;
}

/** Rodapé em todas as páginas: texto à esquerda e "Página X de Y" à direita. */
export function rodape(doc: jsPDF, texto: string) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(210, 210, 210);
    doc.line(MARGEM, A4.altura - 15, A4.largura - MARGEM, A4.altura - 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(limpar(texto), MARGEM, A4.altura - 10);
    doc.text(`Página ${i} de ${total}`, A4.largura - MARGEM, A4.altura - 10, { align: "right" });
  }
  doc.setTextColor(30, 30, 30);
}

/** Baixa uma imagem (URL assinada, /public...) e devolve como dataURL para o PDF. */
export async function imagemComoDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const blob = await r.blob();
    return await new Promise((ok) => {
      const leitor = new FileReader();
      leitor.onload = () => ok(String(leitor.result));
      leitor.onerror = () => ok(null);
      leitor.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export type Coluna = { titulo: string; largura: number; alinhar?: "left" | "right" | "center" };

/**
 * Tabela estilo planilha: cabeçalho na cor da marca (repetido a cada página),
 * linhas zebradas e quebra de texto dentro da célula. Retorna o Y após a tabela.
 */
export function tabela(
  doc: jsPDF,
  colunas: Coluna[],
  linhas: { celulas: string[]; cor?: [number, number, number][] }[],
  y: number,
  aoQuebrar: () => number,
  corCabecalho: string,
  tamanho = 8
) {
  const xs: number[] = [];
  let x = MARGEM;
  for (const c of colunas) {
    xs.push(x);
    x += c.largura;
  }
  const pad = 1.6;
  const alturaLinha = tamanho * 0.42;

  const desenharCabecalho = (yy: number) => {
    doc.setFillColor(...rgb(corCabecalho));
    doc.rect(MARGEM, yy, UTIL, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(tamanho);
    doc.setTextColor(255, 255, 255);
    colunas.forEach((c, i) => {
      const tx = c.alinhar === "right" ? xs[i] + c.largura - pad : c.alinhar === "center" ? xs[i] + c.largura / 2 : xs[i] + pad;
      doc.text(c.titulo, tx, yy + 4.7, { align: c.alinhar ?? "left" });
    });
    doc.setTextColor(30, 30, 30);
    return yy + 7;
  };

  y = desenharCabecalho(y);
  doc.setFont("helvetica", "normal");
  linhas.forEach((l, li) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(tamanho);
    const partes = l.celulas.map((t, i) => doc.splitTextToSize(limpar(t ?? ""), colunas[i].largura - pad * 2) as string[]);
    const h = Math.max(...partes.map((p) => p.length)) * alturaLinha + 3;
    if (y + h > A4.altura - 22) {
      doc.addPage();
      y = desenharCabecalho(aoQuebrar());
      doc.setFont("helvetica", "normal");
      doc.setFontSize(tamanho);
    }
    if (li % 2 === 1) {
      doc.setFillColor(247, 244, 246);
      doc.rect(MARGEM, y, UTIL, h, "F");
    }
    partes.forEach((p, i) => {
      const c = colunas[i];
      const tx = c.alinhar === "right" ? xs[i] + c.largura - pad : c.alinhar === "center" ? xs[i] + c.largura / 2 : xs[i] + pad;
      const cor = l.cor?.[i];
      if (cor) doc.setTextColor(...cor);
      doc.text(p, tx, y + 2 + alturaLinha * 0.85, { align: c.alinhar ?? "left" });
      if (cor) doc.setTextColor(30, 30, 30);
    });
    y += h;
    doc.setDrawColor(225, 220, 223);
    doc.setLineWidth(0.15);
    doc.line(MARGEM, y, MARGEM + UTIL, y);
  });
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  return y;
}

export const VERDE: [number, number, number] = [21, 128, 61];
export const VERMELHO: [number, number, number] = [185, 28, 28];
export const brlPdf = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const numeroLancamento = (n: number | null | undefined) => (n ? String(n).padStart(3, "0") : "—");
