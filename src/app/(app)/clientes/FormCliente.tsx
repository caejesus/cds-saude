"use client";
import { useActionState } from "react";
import { Area, Campo } from "@/components/ui/Campo";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Mensagem } from "@/components/ui/Mensagem";
import type { Cliente } from "@/types/database";
import { atualizarCliente, criarCliente } from "./actions";

export function FormCliente({ cliente, voltar }: { cliente?: Cliente; voltar?: string }) {
  const [estado, acao] = useActionState(cliente ? atualizarCliente : criarCliente, undefined);
  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-2">
      {cliente && <input type="hidden" name="id" value={cliente.id} />}
      {voltar && <input type="hidden" name="voltar" value={voltar} />}
      <Campo rotulo="Nome completo" name="nome" defaultValue={cliente?.nome} required className="sm:col-span-2" autoFocus={!cliente} />
      <Campo rotulo="WhatsApp" name="whatsapp" inputMode="tel" placeholder="(92) 99999-9999" defaultValue={cliente?.whatsapp ?? ""} />
      <Campo rotulo="Telefone" name="telefone" inputMode="tel" defaultValue={cliente?.telefone ?? ""} />
      <Campo rotulo="CPF" name="cpf" inputMode="numeric" defaultValue={cliente?.cpf ?? ""} />
      <Campo rotulo="Data de nascimento" name="data_nascimento" type="date" defaultValue={cliente?.data_nascimento ?? ""} />
      <Campo rotulo="Email" name="email" type="email" defaultValue={cliente?.email ?? ""} />
      <Campo rotulo="Endereço" name="endereco" defaultValue={cliente?.endereco ?? ""} />
      <Area rotulo="Alergias e contraindicações" name="alergias" defaultValue={cliente?.alergias ?? ""} placeholder="Aparece em destaque na ficha e na agenda" />
      <Area rotulo="Observações" name="observacoes" defaultValue={cliente?.observacoes ?? ""} />
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <BotaoEnviar>{cliente ? "Salvar alterações" : "Cadastrar cliente"}</BotaoEnviar>
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}
