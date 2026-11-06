import { A4, brlPdf, cabecalhoRelatorio, MARGEM, novoDocumento, numeroLancamento, rodape, tabela, tituloRelatorio, UTIL, VERDE, VERMELHO, type ClinicaPdf, type Coluna } from "./base";

export type MovimentoPdf = {
  numero: number | null;
  data: string; // dd/MM/yyyy
  usuario: string | null;
  descricao: string;
  cliente: string | null;
  tipo: "entrada" | "saida";
  forma: string | null;
  situacao?: string; // Pago, Pendente, Vencido, Cancelado
  valor: number;
};

type Resumo = { rotulo: string; valor: number; cor?: [number, number, number] }[];

/** Planilha de movimentações (usada no fechamento de caixa e no relatório do mês). */
export function planilhaMovimentos(
  doc: Awaited<ReturnType<typeof novoDocumento>>,
  clinica: ClinicaPdf,
  y: number,
  movimentos: MovimentoPdf[],
  comSituacao: boolean
) {
  const topo = () => cabecalhoRelatorio(doc, clinica);
  const colunas: Coluna[] = comSituacao
    ? [
        { titulo: "Nº", largura: 11, alinhar: "center" },
        { titulo: "Data", largura: 19 },
        { titulo: "Usuário", largura: 18 },
        { titulo: "Descrição", largura: 52 },
        { titulo: "Tipo", largura: 14 },
        { titulo: "Forma", largura: 15 },
        { titulo: "Situação", largura: 17 },
        { titulo: "Valor", largura: 24, alinhar: "right" },
      ]
    : [
        { titulo: "Nº", largura: 12, alinhar: "center" },
        { titulo: "Data", largura: 19 },
        { titulo: "Usuário", largura: 22 },
        { titulo: "Descrição", largura: 63 },
        { titulo: "Tipo", largura: 15 },
        { titulo: "Forma", largura: 16 },
        { titulo: "Valor", largura: 23, alinhar: "right" },
      ];
  const linhas = movimentos.map((m) => {
    const corTipo = m.tipo === "entrada" ? VERDE : VERMELHO;
    const celulas = [
      numeroLancamento(m.numero),
      m.data,
      m.usuario?.split(" ")[0] ?? "—",
      [m.descricao, m.cliente].filter(Boolean).join(" · "),
      m.tipo === "entrada" ? "Entrada" : "Saída",
      m.forma ?? "—",
      ...(comSituacao ? [m.situacao ?? ""] : []),
      `${m.tipo === "saida" ? "- " : ""}${brlPdf(m.valor)}`,
    ];
    const cor = celulas.map((_, i) => (i === celulas.length - 1 ? corTipo : undefined)) as [number, number, number][];
    return { celulas, cor };
  });
  return tabela(doc, colunas, linhas, y, topo, clinica.corPrimaria, 8, "grade");
}

/** Caixas de resumo lado a lado (Entradas, Saídas, Saldo...). */
export function resumo(doc: Awaited<ReturnType<typeof novoDocumento>>, itens: Resumo, y: number) {
  const gap = 4;
  const w = (UTIL - gap * (itens.length - 1)) / itens.length;
  itens.forEach((it, i) => {
    const x = MARGEM + i * (w + gap);
    doc.setDrawColor(225, 220, 223);
    doc.setFillColor(250, 248, 249);
    doc.roundedRect(x, y, w, 15, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(it.rotulo, x + 3, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...(it.cor ?? ([30, 30, 30] as [number, number, number])));
    doc.text(brlPdf(it.valor), x + 3, y + 11.5);
  });
  doc.setTextColor(30, 30, 30);
  return y + 21;
}

export type DadosMovimentosPdf = {
  clinica: ClinicaPdf;
  periodo: string; // "Novembro de 2026"
  filtro: string; // "Todos", "Entradas"...
  geradoEm: string;
  usuario: string;
  movimentos: MovimentoPdf[];
};

export async function gerarMovimentosPdf(d: DadosMovimentosPdf) {
  const doc = await novoDocumento();
  let y = cabecalhoRelatorio(doc, d.clinica);
  y = tituloRelatorio(doc, `Movimentações Financeiras – ${d.periodo}`, y);
  if (d.filtro !== "Todos") {
    doc.setFont("times", "italic");
    doc.setFontSize(9);
    doc.text(`Filtro: ${d.filtro}`, A4.largura / 2, y, { align: "center" });
    y += 4;
  }
  y += 2;
  y = planilhaMovimentos(doc, d.clinica, y, d.movimentos, true);

  const validos = d.movimentos.filter((m) => m.situacao !== "Cancelado");
  const soma = (f: (m: MovimentoPdf) => boolean) => validos.filter(f).reduce((t, m) => t + m.valor, 0);
  const entradas = soma((m) => m.tipo === "entrada" && m.situacao === "Pago");
  const saidas = soma((m) => m.tipo === "saida" && m.situacao === "Pago");
  const aReceber = soma((m) => m.tipo === "entrada" && m.situacao !== "Pago");
  totais(doc, y + 6, [
    ["Recebido", entradas, VERDE],
    ["Pago (despesas)", saidas, VERMELHO],
    ["Saldo realizado", entradas - saidas, undefined],
    ["A receber", aReceber, undefined],
  ], `${d.movimentos.length} lançamentos`);
  rodape(doc, `${d.clinica.nome}  ·  Gerado por ${d.usuario} em ${d.geradoEm}`);
  return doc;
}

/** Quadro de totais alinhado à direita, abaixo da tabela (mesmo estilo de grade). */
export function totais(doc: Awaited<ReturnType<typeof novoDocumento>>, y: number, itens: [string, number, [number, number, number] | undefined][], nota?: string) {
  const w1 = 38;
  const w2 = 32;
  const x = MARGEM + UTIL - w1 - w2;
  if (y + itens.length * 6.5 > A4.altura - 22) {
    doc.addPage();
    y = 20;
  }
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  itens.forEach(([rotulo, valor, cor], i) => {
    const yy = y + i * 6.5;
    doc.rect(x, yy, w1, 6.5, "S");
    doc.rect(x + w1, yy, w2, 6.5, "S");
    doc.setFont("times", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    doc.text(rotulo, x + 1.6, yy + 4.4);
    doc.setFont("times", "normal");
    if (cor) doc.setTextColor(...cor);
    doc.text(brlPdf(valor), x + w1 + w2 - 1.6, yy + 4.4, { align: "right" });
  });
  doc.setTextColor(110, 110, 110);
  if (nota) {
    doc.setFont("times", "italic");
    doc.setFontSize(8.5);
    doc.text(nota, MARGEM, y + 4.4);
  }
  doc.setTextColor(30, 30, 30);
  return y + itens.length * 6.5;
}
