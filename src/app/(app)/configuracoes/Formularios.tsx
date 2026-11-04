"use client";
import { useActionState } from "react";
import { Campo } from "@/components/ui/Campo";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Mensagem } from "@/components/ui/Mensagem";
import type { Clinica, Procedimento, Profissional } from "@/types/database";
import { salvarClinica, salvarProcedimento, salvarProfissional } from "./actions";

export function FormClinica({ clinica, podeEditar }: { clinica: Clinica; podeEditar: boolean }) {
  const [estado, acao] = useActionState(salvarClinica, undefined);
  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-2">
      <fieldset disabled={!podeEditar} className="contents">
        <Campo rotulo="Nome da clínica" name="nome" defaultValue={clinica.nome} required className="sm:col-span-2" />
        <Campo rotulo="CNPJ" name="cnpj" defaultValue={clinica.cnpj ?? ""} />
        <Campo rotulo="Telefone" name="telefone" defaultValue={clinica.telefone ?? ""} />
        <Campo rotulo="Email" name="email" type="email" defaultValue={clinica.email ?? ""} />
        <Campo rotulo="Endereço" name="endereco" defaultValue={clinica.endereco ?? ""} />
        <Campo rotulo="Cidade" name="cidade" defaultValue={clinica.cidade ?? ""} />
        <Campo rotulo="Estado (UF)" name="estado" maxLength={2} defaultValue={clinica.estado ?? ""} />
      </fieldset>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        {podeEditar ? <BotaoEnviar>Salvar dados</BotaoEnviar> : <p className="text-sm text-vinho-muted">Só o administrador pode editar.</p>}
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}

export function FormProfissional({ p, aoSalvar }: { p?: Profissional; aoSalvar?: () => void }) {
  const [estado, acao] = useActionState(async (s: Parameters<typeof salvarProfissional>[0], f: FormData) => {
    const r = await salvarProfissional(s, f);
    if (r?.ok) aoSalvar?.();
    return r;
  }, undefined);
  return (
    <form action={acao} className="grid gap-3 sm:grid-cols-2">
      {p && <input type="hidden" name="id" value={p.id} />}
      <Campo rotulo="Nome" name="nome" defaultValue={p?.nome} required />
      <Campo rotulo="Especialidade" name="especialidade" defaultValue={p?.especialidade ?? ""} placeholder="Ex.: Esteticista, Dentista" />
      <Campo rotulo="Registro (CRO, CRM...)" name="registro" defaultValue={p?.registro ?? ""} />
      <Campo rotulo="Telefone" name="telefone" defaultValue={p?.telefone ?? ""} />
      <label className="block text-sm">
        <span className="mb-1 block text-vinho-escuro/80">Cor na agenda</span>
        <input type="color" name="cor_agenda" defaultValue={p?.cor_agenda ?? "#7d1635"} className="h-10 w-20 cursor-pointer rounded-lg border border-vinho-borda bg-white p-1" />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <BotaoEnviar>{p ? "Salvar" : "Adicionar profissional"}</BotaoEnviar>
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}

export function FormProcedimento({ p, aoSalvar }: { p?: Procedimento; aoSalvar?: () => void }) {
  const [estado, acao] = useActionState(async (s: Parameters<typeof salvarProcedimento>[0], f: FormData) => {
    const r = await salvarProcedimento(s, f);
    if (r?.ok) aoSalvar?.();
    return r;
  }, undefined);
  return (
    <form action={acao} className="grid gap-3 sm:grid-cols-2">
      {p && <input type="hidden" name="id" value={p.id} />}
      <Campo rotulo="Nome" name="nome" defaultValue={p?.nome} required placeholder="Ex.: Limpeza de pele" />
      <Campo rotulo="Categoria" name="categoria" defaultValue={p?.categoria ?? ""} placeholder="Ex.: Facial" />
      <Campo rotulo="Duração (minutos)" name="duracao_minutos" type="number" min={5} max={600} step={5} defaultValue={p?.duracao_minutos ?? 60} required />
      <Campo rotulo="Valor (R$)" name="valor" inputMode="decimal" defaultValue={p ? String(p.valor).replace(".", ",") : ""} placeholder="0,00" />
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <BotaoEnviar>{p ? "Salvar" : "Adicionar procedimento"}</BotaoEnviar>
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}
