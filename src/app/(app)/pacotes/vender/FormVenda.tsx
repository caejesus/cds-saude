"use client";
import { useActionState, useState } from "react";
import { Campo, Selecao } from "@/components/ui/Campo";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Mensagem } from "@/components/ui/Mensagem";
import { brl, FORMAS } from "@/lib/formato";
import type { Pacote } from "@/types/database";
import { venderPacote } from "../actions";

export function FormVenda({ clientes, modelos, clienteInicial, hoje }: {
  clientes: { id: string; nome: string }[];
  modelos: Pacote[];
  clienteInicial?: string;
  hoje: string;
}) {
  const [estado, acao] = useActionState(venderPacote, undefined);
  const [modeloId, setModeloId] = useState(modelos[0]?.id ?? "");
  const modelo = modelos.find((m) => m.id === modeloId);
  const [valor, setValor] = useState(modelo ? String(modelo.valor).replace(".", ",") : "");
  const [parcelas, setParcelas] = useState(1);
  const [pago, setPago] = useState(true);
  const total = Number(valor.replace(/\./g, "").replace(",", ".")) || 0;

  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-2">
      <Selecao rotulo="Cliente" name="cliente_id" required defaultValue={clienteInicial ?? ""} className="sm:col-span-2">
        <option value="" disabled>Selecione</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>{c.nome}</option>
        ))}
      </Selecao>
      <Selecao
        rotulo="Pacote"
        name="pacote_id"
        required
        value={modeloId}
        onChange={(e) => {
          setModeloId(e.target.value);
          const m = modelos.find((x) => x.id === e.target.value);
          if (m) setValor(String(m.valor).replace(".", ","));
        }}
        className="sm:col-span-2"
      >
        {modelos.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nome} · {m.qtd_sessoes} sessões · {brl(Number(m.valor))}
          </option>
        ))}
      </Selecao>
      <Campo rotulo="Valor cobrado (R$)" name="valor" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
      <Selecao rotulo="Parcelas" name="parcelas" value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{n === 1 ? "À vista" : `${n}x de ${brl(total / n)}`}</option>
        ))}
      </Selecao>
      <Campo rotulo={parcelas > 1 ? "1º vencimento" : "Vencimento"} name="vencimento" type="date" defaultValue={hoje} />
      <Selecao rotulo="Forma de pagamento" name="forma_pagamento" defaultValue="pix">
        {Object.entries(FORMAS).map(([v, r]) => (
          <option key={v} value={v}>{r}</option>
        ))}
      </Selecao>
      <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
        <input type="checkbox" name="pago" value="1" checked={pago} onChange={(e) => setPago(e.target.checked)} className="h-4 w-4 accent-vinho-acao" />
        {parcelas > 1 ? "1ª parcela paga agora" : "Pago agora"}
      </label>
      {modelo && total < Number(modelo.valor) && total > 0 && (
        <p className="text-sm text-vinho-muted sm:col-span-2">Desconto de {brl(Number(modelo.valor) - total)}.</p>
      )}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <BotaoEnviar>Confirmar venda</BotaoEnviar>
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}
