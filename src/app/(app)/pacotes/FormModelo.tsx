"use client";
import { useActionState, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Campo, Selecao } from "@/components/ui/Campo";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Mensagem } from "@/components/ui/Mensagem";
import { brl } from "@/lib/formato";
import type { Pacote, Procedimento } from "@/types/database";
import { alternarModelo, salvarModelo } from "./actions";

function Form({ p, procedimentos, aoSalvar }: { p?: Pacote; procedimentos: Procedimento[]; aoSalvar: () => void }) {
  const [estado, acao] = useActionState(async (s: Parameters<typeof salvarModelo>[0], f: FormData) => {
    const r = await salvarModelo(s, f);
    if (r?.ok) aoSalvar();
    return r;
  }, undefined);
  return (
    <form action={acao} className="grid gap-3 sm:grid-cols-2">
      {p && <input type="hidden" name="id" value={p.id} />}
      <Campo rotulo="Nome do pacote" name="nome" required defaultValue={p?.nome} placeholder="Ex.: 10 sessões de drenagem" className="sm:col-span-2" />
      <Selecao rotulo="Procedimento" name="procedimento_id" defaultValue={p?.procedimento_id ?? ""}>
        <option value="">Qualquer procedimento</option>
        {procedimentos.map((x) => (
          <option key={x.id} value={x.id}>{x.nome}</option>
        ))}
      </Selecao>
      <Campo rotulo="Sessões" name="qtd_sessoes" type="number" min={1} max={100} required defaultValue={p?.qtd_sessoes ?? 10} />
      <Campo rotulo="Valor do pacote (R$)" name="valor" inputMode="decimal" required defaultValue={p ? String(p.valor).replace(".", ",") : ""} placeholder="0,00" />
      <Campo rotulo="Validade (dias)" name="validade_dias" type="number" min={1} max={1095} defaultValue={p?.validade_dias ?? 180} />
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <BotaoEnviar>{p ? "Salvar" : "Criar pacote"}</BotaoEnviar>
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}

export function ModelosPacote({ modelos, procedimentos }: { modelos: Pacote[]; procedimentos: Procedimento[] }) {
  const [editando, setEditando] = useState<string | null>(null);
  const nomeProc = (id: string | null) => procedimentos.find((p) => p.id === id)?.nome;
  return (
    <div>
      {modelos.length === 0 && <p className="text-sm text-vinho-muted">Nenhum pacote criado. Crie os pacotes que a clínica vende.</p>}
      <ul className="divide-y divide-vinho-borda">
        {modelos.map((m) => (
          <li key={m.id} className={`py-3 ${m.ativo ? "" : "opacity-55"}`}>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.nome}</p>
                <p className="truncate text-xs text-vinho-muted">
                  {m.qtd_sessoes} sessões · {brl(Number(m.valor))} · {brl(Number(m.valor) / m.qtd_sessoes)}/sessão · {m.validade_dias} dias
                  {nomeProc(m.procedimento_id) && ` · ${nomeProc(m.procedimento_id)}`}
                </p>
              </div>
              <form action={alternarModelo}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="ativo" value={String(!m.ativo)} />
                <button className="rounded-full border border-vinho-borda px-2.5 py-1 text-[11px] text-vinho-muted hover:border-vinho-medio">
                  {m.ativo ? "Desativar" : "Reativar"}
                </button>
              </form>
              <button type="button" onClick={() => setEditando(editando === m.id ? null : m.id)} className="rounded-lg p-1.5 text-vinho-muted hover:bg-vinho-fundo hover:text-vinho-acao" aria-label="Editar">
                {editando === m.id ? <X size={16} /> : <Pencil size={16} />}
              </button>
            </div>
            {editando === m.id && (
              <div className="mt-3 rounded-lg bg-vinho-fundo p-4">
                <Form p={m} procedimentos={procedimentos} aoSalvar={() => setEditando(null)} />
              </div>
            )}
          </li>
        ))}
      </ul>
      {editando === "novo" ? (
        <div className="mt-3 rounded-lg border border-vinho-borda p-4">
          <Form procedimentos={procedimentos} aoSalvar={() => setEditando(null)} />
        </div>
      ) : (
        <button type="button" onClick={() => setEditando("novo")} className="botao-sec mt-2">
          <Plus size={16} /> Novo pacote
        </button>
      )}
    </div>
  );
}
