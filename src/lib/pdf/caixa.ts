import { A4, cabecalho, MARGEM, novoDocumento, rodape, titulo, UTIL, limpar, type ClinicaPdf } from "./base";

export type DadosCaixaPdf = {
  clinica: ClinicaPdf;
  data: string; // dd/MM/yyyy
  geradoEm: string;
  responsavel: string;
  porForma: { forma: string; entra: number; sai: number }[];
  itens: { descricao: string; cliente: string | null; forma: string; tipo: "entrada" | "saida"; valor: number }[];
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export async function gerarCaixaPdf(d: DadosCaixaPdf) {
  const doc = await novoDocumento();
  const topo = () => cabecalho(doc, d.clinica);
  let y = topo();
  y = titulo(doc, `Fechamento de caixa · ${d.data}`, y);

  const linha = (yy: number) => {
    doc.setDrawColor(220, 220, 220);
    doc.line(MARGEM, yy, MARGEM + UTIL, yy);
  };
  const xFim = MARGEM + UTIL;

  // Resumo por forma de pagamento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Forma de pagamento", MARGEM, y);
  doc.text("Entradas", xFim - 40, y, { align: "right" });
  doc.text("Saídas", xFim, y, { align: "right" });
  y += 2;
  linha(y);
  y += 5;
  doc.setFont("helvetica", "normal");
  let entra = 0;
  let sai = 0;
  for (const f of d.porForma) {
    doc.text(limpar(f.forma), MARGEM, y);
    doc.text(f.entra ? brl(f.entra) : "-", xFim - 40, y, { align: "right" });
    doc.text(f.sai ? brl(f.sai) : "-", xFim, y, { align: "right" });
    entra += f.entra;
    sai += f.sai;
    y += 2;
    linha(y);
    y += 5;
  }
  doc.setFont("helvetica", "bold");
  doc.text("Totais", MARGEM, y);
  doc.text(brl(entra), xFim - 40, y, { align: "right" });
  doc.text(brl(sai), xFim, y, { align: "right" });
  y += 8;
  doc.setFontSize(12);
  doc.text(`Saldo do dia: ${brl(entra - sai)}`, xFim, y, { align: "right" });
  y += 12;

  // Movimentos
  doc.setFontSize(10);
  doc.text("Movimentos", MARGEM, y);
  y += 2;
  linha(y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  for (const it of d.itens) {
    if (y > A4.altura - 45) {
      doc.addPage();
      y = topo();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }
    const desc = limpar([it.descricao, it.cliente].filter(Boolean).join(" · "));
    const linhas: string[] = doc.splitTextToSize(desc, UTIL - 70);
    doc.text(linhas, MARGEM, y);
    doc.text(limpar(it.forma), xFim - 40, y, { align: "right" });
    doc.text(`${it.tipo === "saida" ? "- " : ""}${brl(it.valor)}`, xFim, y, { align: "right" });
    y += linhas.length * 4 + 1.5;
    linha(y - 2.5);
    y += 2;
  }

  // Conferência
  if (y > A4.altura - 55) {
    doc.addPage();
    y = topo();
  }
  y += 18;
  doc.setDrawColor(0, 0, 0);
  doc.line(MARGEM, y, MARGEM + 70, y);
  doc.line(xFim - 70, y, xFim, y);
  doc.setFontSize(8.5);
  doc.text(limpar(d.responsavel), MARGEM + 35, y + 4.5, { align: "center" });
  doc.text("Conferido por", xFim - 35, y + 4.5, { align: "center" });

  rodape(doc, `${d.clinica.nome}  ·  Gerado em ${d.geradoEm}`);
  return doc;
}
