import { A4, brlPdf, cabecalho, MARGEM, novoDocumento, rodape, titulo, UTIL, VERDE, VERMELHO, limpar, type ClinicaPdf } from "./base";
import { planilhaMovimentos, resumo, type MovimentoPdf } from "./movimentos";

export type DadosCaixaPdf = {
  clinica: ClinicaPdf;
  data: string; // dd/MM/yyyy
  geradoEm: string;
  responsavel: string;
  porForma: { forma: string; entra: number; sai: number }[];
  itens: MovimentoPdf[];
};

export async function gerarCaixaPdf(d: DadosCaixaPdf) {
  const doc = await novoDocumento();
  const topo = () => cabecalho(doc, d.clinica);
  let y = topo();
  y = titulo(doc, `Fechamento de caixa · ${d.data}`, y);

  const entra = d.porForma.reduce((t, f) => t + f.entra, 0);
  const sai = d.porForma.reduce((t, f) => t + f.sai, 0);
  y = resumo(doc, [
    { rotulo: "Entradas", valor: entra, cor: VERDE },
    { rotulo: "Saídas", valor: sai, cor: VERMELHO },
    { rotulo: "Saldo do dia", valor: entra - sai },
  ], y);

  // Totais por forma de pagamento (linha compacta)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  const formas = d.porForma.map((f) => `${f.forma}: ${brlPdf(f.entra - f.sai)}`).join("   ·   ");
  doc.text(limpar(formas || "Sem movimentos"), MARGEM, y - 2);
  doc.setTextColor(30, 30, 30);
  y += 2;

  y = planilhaMovimentos(doc, d.clinica, y, d.itens, false);

  // Assinaturas
  if (y > A4.altura - 50) {
    doc.addPage();
    y = topo();
  }
  y += 20;
  const xFim = MARGEM + UTIL;
  doc.setDrawColor(0, 0, 0);
  doc.line(MARGEM, y, MARGEM + 70, y);
  doc.line(xFim - 70, y, xFim, y);
  doc.setFontSize(8.5);
  doc.text(limpar(d.responsavel), MARGEM + 35, y + 4.5, { align: "center" });
  doc.text("Conferido por", xFim - 35, y + 4.5, { align: "center" });

  rodape(doc, `${d.clinica.nome}  ·  Gerado em ${d.geradoEm}`);
  return doc;
}
