import { somarMesesData } from "@/lib/tempo";

type Parcelas = {
  clinica_id: string;
  tipo: "entrada" | "saida";
  descricao: string;
  total: number;
  parcelas: number;
  vencimento: string;
  categoria: string | null;
  forma_pagamento: string | null;
  primeiraPaga: boolean;
  pagoEm: string;
  cliente_id: string | null;
  agendamento_id?: string | null;
  origem_tipo?: string | null;
  origem_id?: string | null;
};

/** Divide um valor em parcelas mensais (centavos exatos; a diferença vai na última). */
export function montarParcelas(p: Parcelas) {
  const n = Math.min(24, Math.max(1, Math.round(p.parcelas)));
  const centavos = Math.round(p.total * 100);
  const base = Math.floor(centavos / n);
  return Array.from({ length: n }, (_, i) => {
    const quitada = p.primeiraPaga && i === 0;
    return {
      clinica_id: p.clinica_id,
      tipo: p.tipo,
      descricao: n > 1 ? `${p.descricao} (${i + 1}/${n})` : p.descricao,
      valor: (i === n - 1 ? centavos - base * (n - 1) : base) / 100,
      categoria: p.categoria,
      forma_pagamento: p.forma_pagamento,
      vencimento: somarMesesData(p.vencimento, i),
      status: quitada ? "pago" : "pendente",
      pago_em: quitada ? p.pagoEm : null,
      cliente_id: p.cliente_id,
      agendamento_id: i === 0 ? (p.agendamento_id ?? null) : null,
      origem_tipo: p.origem_tipo ?? null,
      origem_id: p.origem_id ?? null,
    };
  });
}

export const FORMAS_VALIDAS = ["dinheiro", "pix", "debito", "credito", "boleto", "outro"];
export const formaValida = (v: string | null) => (v && FORMAS_VALIDAS.includes(v) ? v : null);
