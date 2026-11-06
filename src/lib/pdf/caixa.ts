import { A4, brlPdf, cabecalhoRelatorio, MARGEM, novoDocumento, rodape, tituloRelatorio, UTIL, VERDE, VERMELHO, limpar, type ClinicaPdf } from "./base";
import { planilhaMovimentos, totais, type MovimentoPdf } from "./movimentos";

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
  const topo = () => cabecalhoRelatorio(doc, d.clinica);
  let y = topo();
  y = tituloRelatorio(doc, `Fechamento de Caixa – ${d.data}`, y) + 2;

  y = planilhaMovimentos(doc, d.clinica, y, d.itens, false);

  const entra = d.porForma.reduce((t, f) => t + f.entra, 0);
  const sai = d.porForma.reduce((t, f) => t + f.sai, 0);
  const formas = d.porForma.map((f) => `${f.forma}: ${brlPdf(f.entra - f.sai)}`).join("   ·   ");
  y = totais(doc, y + 6, [
    ["Entradas", entra, VERDE],
    ["Saídas", sai, VERMELHO],
    ["Saldo do dia", entra - sai, undefined],
  ], limpar(formas || "Sem movimentos"));

  // Assinaturas
  if (y > A4.altura - 50) {
    doc.addPage();
    y = topo();
  }
  y += 24;
  const xFim = MARGEM + UTIL;
  doc.setDrawColor(0, 0, 0);
  doc.line(MARGEM, y, MARGEM + 70, y);
  doc.line(xFim - 70, y, xFim, y);
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text(limpar(d.responsavel), MARGEM + 35, y + 4.5, { align: "center" });
  doc.text("Conferido por", xFim - 35, y + 4.5, { align: "center" });

  rodape(doc, `${d.clinica.nome}  ·  Gerado em ${d.geradoEm}`);
  return doc;
}
