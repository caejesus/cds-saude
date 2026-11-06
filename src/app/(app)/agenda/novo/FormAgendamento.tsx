"use client";
import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Area, Campo, Selecao } from "@/components/ui/Campo";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Mensagem } from "@/components/ui/Mensagem";
import { brl } from "@/lib/formato";
import type { Procedimento, Profissional } from "@/types/database";
import { salvarAgendamento } from "../actions";
import { DiaDoProfissional } from "./DiaDoProfissional";

type ClienteOpcao = { id: string; nome: string; alergias: string | null };
export type Inicial = {
  id?: string;
  cliente_id?: string;
  profissional_id?: string;
  procedimento_id?: string;
  data: string;
  hora: string;
  duracao?: number;
  observacoes?: string;
};

export function FormAgendamento({ clientes, profissionais, procedimentos, inicial, hoje, agoraMin }: {
  clientes: ClienteOpcao[];
  profissionais: Profissional[];
  procedimentos: Procedimento[];
  inicial: Inicial;
  hoje: string;
  agoraMin: number;
}) {
  const [estado, acao] = useActionState(salvarAgendamento, undefined);
  const [clienteId, setClienteId] = useState(inicial.cliente_id ?? "");
  const [procId, setProcId] = useState(inicial.procedimento_id ?? "");
  const [duracao, setDuracao] = useState(
    inicial.duracao ?? procedimentos.find((p) => p.id === inicial.procedimento_id)?.duracao_minutos ?? 60
  );
  const [filtro, setFiltro] = useState("");
  const [profId, setProfId] = useState(inicial.profissional_id ?? (profissionais.length === 1 ? profissionais[0].id : ""));
  const [data, setData] = useState(inicial.data);
  const [hora, setHora] = useState(inicial.hora);
  const cliente = clientes.find((c) => c.id === clienteId);
  const conflito = estado?.erro?.startsWith("Conflito");

  const visiveis = useMemo(() => {
    const t = filtro.trim().toLowerCase();
    const base = t ? clientes.filter((c) => c.nome.toLowerCase().includes(t)) : clientes;
    // mantém o selecionado na lista mesmo filtrando
    return cliente && !base.includes(cliente) ? [cliente, ...base] : base;
  }, [filtro, clientes, cliente]);

  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-2">
      {inicial.id && <input type="hidden" name="id" value={inicial.id} />}

      <div className="space-y-2 sm:col-span-2">
        <div className="flex items-end gap-2">
          <Campo rotulo="Cliente" placeholder="Digite para filtrar..." value={filtro} onChange={(e) => setFiltro(e.target.value)} className="flex-1" />
          <Link href="/clientes/novo?voltar=agenda" className="botao-sec h-[42px]" title="Cadastrar cliente novo">
            <UserPlus size={16} /> <span className="hidden sm:inline">Novo</span>
          </Link>
        </div>
        <select name="cliente_id" required value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="campo" size={Math.min(6, Math.max(2, visiveis.length + 1))}>
          <option value="" disabled>
            {clientes.length === 0 ? "Nenhum cliente cadastrado" : "Selecione o cliente"}
          </option>
          {visiveis.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
              {c.alergias ? "  ⚠" : ""}
            </option>
          ))}
        </select>
        {cliente?.alergias && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">⚠ Alergias: {cliente.alergias}</p>
        )}
      </div>

      <Selecao rotulo="Profissional" name="profissional_id" required value={profId} onChange={(e) => setProfId(e.target.value)}>
        <option value="" disabled>Selecione</option>
        {profissionais.map((p) => (
          <option key={p.id} value={p.id}>{p.nome}</option>
        ))}
      </Selecao>

      <Selecao
        rotulo="Procedimento"
        name="procedimento_id"
        value={procId}
        onChange={(e) => {
          setProcId(e.target.value);
          const p = procedimentos.find((x) => x.id === e.target.value);
          if (p) setDuracao(p.duracao_minutos);
        }}
      >
        <option value="">Sem procedimento definido</option>
        {procedimentos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome} · {p.duracao_minutos} min · {brl(Number(p.valor))}
          </option>
        ))}
      </Selecao>

      <Campo rotulo="Data" name="data" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Horário" name="hora" type="time" step={300} required value={hora} onChange={(e) => setHora(e.target.value)} />
        <Campo rotulo="Duração (min)" name="duracao" type="number" min={5} max={600} step={5} required value={duracao} onChange={(e) => setDuracao(Number(e.target.value))} />
      </div>

      <DiaDoProfissional
        profissionalId={profId}
        profissionalNome={profissionais.find((p) => p.id === profId)?.nome ?? ""}
        data={data}
        duracao={duracao}
        hora={hora}
        ignorarId={inicial.id}
        hoje={hoje}
        agoraMin={agoraMin}
        onEscolher={setHora}
      />

      <Area rotulo="Observações" name="observacoes" defaultValue={inicial.observacoes ?? ""} className="sm:col-span-2" />

      <div className="space-y-3 sm:col-span-2">
        <Mensagem estado={estado} />
        {conflito && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="forcar" value="1" className="accent-vinho-acao" /> Permitir encaixe neste horário
          </label>
        )}
        <BotaoEnviar>{inicial.id ? "Salvar alterações" : "Agendar"}</BotaoEnviar>
      </div>
    </form>
  );
}
