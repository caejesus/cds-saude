"use client";
import { useActionState, useState } from "react";
import { Selecao } from "@/components/ui/Campo";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Mensagem } from "@/components/ui/Mensagem";
import { modeloTermo } from "@/lib/termo";
import { criarTermo } from "../actions";

type Dados = { cliente: string; cpf: string | null; clinica: string; cidade: string | null; data: string };

export function FormTermo({ clienteId, procedimentos, dados }: { clienteId: string; procedimentos: { id: string; nome: string }[]; dados: Dados }) {
  const [estado, acao] = useActionState(criarTermo, undefined);
  const [procId, setProcId] = useState(procedimentos[0]?.id ?? "");
  const nome = (id: string) => procedimentos.find((p) => p.id === id)?.nome ?? "estética";
  const [txt, setTxt] = useState(modeloTermo({ ...dados, procedimento: nome(procId) }));

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="cliente_id" value={clienteId} />
      <Selecao
        rotulo="Procedimento"
        name="procedimento_id"
        value={procId}
        onChange={(e) => {
          setProcId(e.target.value);
          setTxt(modeloTermo({ ...dados, procedimento: nome(e.target.value) }));
        }}
      >
        {procedimentos.length === 0 && <option value="">Procedimento estético</option>}
        {procedimentos.map((p) => (
          <option key={p.id} value={p.id}>{p.nome}</option>
        ))}
      </Selecao>
      <label className="block text-sm">
        <span className="mb-1 block text-vinho-escuro/80">Texto do termo (pode editar antes de gerar)</span>
        <textarea name="texto" value={txt} onChange={(e) => setTxt(e.target.value)} className="campo min-h-[420px] font-mono text-[13px] leading-relaxed" />
      </label>
      <p className="text-xs text-vinho-muted">Modelo genérico: revise com o responsável técnico da clínica. Depois de assinado, o termo não pode ser alterado.</p>
      <div className="flex flex-wrap items-center gap-3">
        <BotaoEnviar>Gerar termo para assinatura</BotaoEnviar>
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}
