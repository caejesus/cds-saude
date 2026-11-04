"use client";
import { useActionState, useState } from "react";
import { Campo, Selecao } from "@/components/ui/Campo";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Mensagem } from "@/components/ui/Mensagem";
import { brl, CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA, FORMAS } from "@/lib/formato";
import { salvarLancamento } from "../actions";

export type InicialLancamento = {
  tipo: "entrada" | "saida";
  descricao?: string;
  valor?: number;
  categoria?: string;
  cliente_id?: string;
  agendamento_id?: string;
  vencimento: string;
  hoje: string;
  pago?: boolean;
  voltar?: string;
};

export function FormLancamento({ inicial, clientes }: { inicial: InicialLancamento; clientes: { id: string; nome: string }[] }) {
  const [estado, acao] = useActionState(salvarLancamento, undefined);
  const [tipo, setTipo] = useState(inicial.tipo);
  const [pago, setPago] = useState(inicial.pago ?? false);
  const [valor, setValor] = useState(inicial.valor ? String(inicial.valor).replace(".", ",") : "");
  const [parcelas, setParcelas] = useState(1);
  const total = Number(valor.replace(/\./g, "").replace(",", ".")) || 0;
  const categorias = tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="tipo" value={tipo} />
      {inicial.agendamento_id && <input type="hidden" name="agendamento_id" value={inicial.agendamento_id} />}
      {inicial.voltar && <input type="hidden" name="voltar" value={inicial.voltar} />}

      <div className="grid grid-cols-2 gap-2 sm:col-span-2">
        {(["entrada", "saida"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            disabled={!!inicial.agendamento_id}
            className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              tipo === t
                ? t === "entrada"
                  ? "border-green-600 bg-green-50 text-green-800"
                  : "border-red-600 bg-red-50 text-red-800"
                : "border-vinho-borda text-vinho-muted hover:border-vinho-medio"
            }`}
          >
            {t === "entrada" ? "Entrada (receita)" : "Saída (despesa)"}
          </button>
        ))}
      </div>

      <Campo rotulo="Descrição" name="descricao" required defaultValue={inicial.descricao} className="sm:col-span-2"
        placeholder={tipo === "entrada" ? "Ex.: Limpeza de pele, Pacote 10 sessões" : "Ex.: Aluguel de novembro"} />
      <Campo rotulo="Valor total (R$)" name="valor" inputMode="decimal" required value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
      <Selecao rotulo="Categoria" name="categoria" defaultValue={inicial.categoria ?? ""} key={tipo}>
        <option value="">Sem categoria</option>
        {categorias.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </Selecao>

      {tipo === "entrada" && (
        <Selecao rotulo="Cliente" name="cliente_id" defaultValue={inicial.cliente_id ?? ""} className="sm:col-span-2">
          <option value="">Nenhum</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </Selecao>
      )}

      <Campo rotulo={parcelas > 1 ? "Vencimento da 1ª parcela" : "Vencimento"} name="vencimento" type="date" required defaultValue={inicial.vencimento} />
      <Selecao rotulo="Parcelas" name="parcelas" value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n === 1 ? "À vista" : `${n}x${total ? ` de ${brl(total / n)}` : ""}`}
          </option>
        ))}
      </Selecao>

      <div className="space-y-3 rounded-lg bg-vinho-fundo p-4 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="pago" value="1" checked={pago} onChange={(e) => setPago(e.target.checked)} className="h-4 w-4 accent-vinho-acao" />
          {parcelas > 1 ? "1ª parcela já foi paga" : tipo === "entrada" ? "Já foi recebido" : "Já foi pago"}
        </label>
        {pago && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Selecao rotulo="Forma de pagamento" name="forma_pagamento" defaultValue="pix">
              {Object.entries(FORMAS).map(([v, r]) => (
                <option key={v} value={v}>{r}</option>
              ))}
            </Selecao>
            <Campo rotulo="Data do pagamento" name="pago_em" type="date" defaultValue={inicial.hoje} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <BotaoEnviar>Salvar lançamento</BotaoEnviar>
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}
