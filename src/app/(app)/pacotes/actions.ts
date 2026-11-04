"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays, format } from "date-fns";
import { getContexto } from "@/lib/contexto";
import { formaValida, montarParcelas } from "@/lib/financeiro";
import { numero, texto, traduzErro, type Resultado } from "@/lib/resultado";
import { deLocal, hojeISO } from "@/lib/tempo";
import type { Pacote } from "@/types/database";

function revalidar(clienteId?: string | null) {
  revalidatePath("/pacotes");
  revalidatePath("/agenda");
  revalidatePath("/financeiro");
  revalidatePath("/dashboard");
  if (clienteId) revalidatePath(`/clientes/${clienteId}`);
}

export async function salvarModelo(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, clinica } = await getContexto();
  const id = texto(f, "id");
  const nome = texto(f, "nome");
  const qtd = numero(f, "qtd_sessoes");
  const valor = numero(f, "valor");
  const validade = numero(f, "validade_dias") ?? 180;
  if (!nome) return { erro: "Informe o nome do pacote." };
  if (!qtd || qtd < 1 || qtd > 100) return { erro: "Quantidade de sessões deve ficar entre 1 e 100." };
  if (valor === null || valor < 0) return { erro: "Informe o valor do pacote." };
  if (validade < 1 || validade > 1095) return { erro: "Validade deve ficar entre 1 e 1095 dias." };
  const dados = { nome, procedimento_id: texto(f, "procedimento_id"), qtd_sessoes: Math.round(qtd), valor, validade_dias: Math.round(validade) };
  const { error } = id
    ? await supabase.from("pacotes").update(dados).eq("id", id)
    : await supabase.from("pacotes").insert({ ...dados, clinica_id: clinica.id });
  if (error) return { erro: traduzErro(error.message) };
  revalidatePath("/pacotes");
  return { ok: id ? "Pacote atualizado." : "Pacote criado." };
}

export async function alternarModelo(f: FormData) {
  const { supabase } = await getContexto();
  const id = texto(f, "id");
  if (!id) return;
  await supabase.from("pacotes").update({ ativo: texto(f, "ativo") === "true" }).eq("id", id);
  revalidatePath("/pacotes");
}

export async function venderPacote(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, clinica } = await getContexto();
  const cliente_id = texto(f, "cliente_id");
  const pacote_id = texto(f, "pacote_id");
  if (!cliente_id) return { erro: "Escolha o cliente." };
  if (!pacote_id) return { erro: "Escolha o pacote." };
  const { data: pacote } = await supabase.from("pacotes").select("*").eq("id", pacote_id).maybeSingle<Pacote>();
  if (!pacote) return { erro: "Pacote não encontrado." };

  const total = numero(f, "valor") ?? Number(pacote.valor);
  const desconto = Math.max(0, Number(pacote.valor) - total);
  const hoje = hojeISO();
  const valido_ate = format(addDays(deLocal(hoje, "12:00"), pacote.validade_dias), "yyyy-MM-dd");

  const { data: vendido, error } = await supabase
    .from("pacotes_cliente")
    .insert({ clinica_id: clinica.id, cliente_id, pacote_id, sessoes_total: pacote.qtd_sessoes, valido_ate })
    .select("id")
    .single();
  if (error) return { erro: traduzErro(error.message) };

  if (total > 0) {
    const linhas = montarParcelas({
      clinica_id: clinica.id,
      tipo: "entrada",
      descricao: `${pacote.nome}${desconto > 0 ? " (com desconto)" : ""}`,
      total,
      parcelas: numero(f, "parcelas") ?? 1,
      vencimento: texto(f, "vencimento") ?? hoje,
      categoria: "Pacotes",
      forma_pagamento: formaValida(texto(f, "forma_pagamento")),
      primeiraPaga: texto(f, "pago") === "1",
      pagoEm: hoje,
      cliente_id,
      origem_tipo: "pacote",
      origem_id: vendido.id,
    });
    const { error: e2 } = await supabase.from("lancamentos").insert(linhas);
    if (e2) {
      await supabase.from("pacotes_cliente").delete().eq("id", vendido.id);
      return { erro: traduzErro(e2.message) };
    }
  }
  revalidar(cliente_id);
  redirect(`/clientes/${cliente_id}`);
}

/** Dá baixa de uma sessão do pacote e vincula ao atendimento. */
export async function usarSessao(f: FormData) {
  const { supabase } = await getContexto();
  const agendamento_id = texto(f, "agendamento_id");
  const pacote_cliente_id = texto(f, "pacote_cliente_id");
  if (!agendamento_id || !pacote_cliente_id) return;
  const { data: pc } = await supabase
    .from("pacotes_cliente")
    .select("id, cliente_id, sessoes_total, sessoes_usadas, status")
    .eq("id", pacote_cliente_id)
    .maybeSingle<{ id: string; cliente_id: string; sessoes_total: number; sessoes_usadas: number; status: string }>();
  if (!pc || pc.status !== "ativo" || pc.sessoes_usadas >= pc.sessoes_total) return;
  const { data: ag } = await supabase
    .from("agendamentos")
    .update({ pacote_cliente_id })
    .eq("id", agendamento_id)
    .is("pacote_cliente_id", null)
    .select("id")
    .maybeSingle();
  if (!ag) return; // já tinha sessão vinculada
  const usadas = pc.sessoes_usadas + 1;
  await supabase
    .from("pacotes_cliente")
    .update({ sessoes_usadas: usadas, status: usadas >= pc.sessoes_total ? "concluido" : "ativo" })
    .eq("id", pc.id);
  revalidar(pc.cliente_id);
}

/** Desfaz a baixa (ex.: marcou a sessão errada). */
export async function estornarSessao(f: FormData) {
  const { supabase } = await getContexto();
  const agendamento_id = texto(f, "agendamento_id");
  if (!agendamento_id) return;
  const { data: ag } = await supabase
    .from("agendamentos")
    .select("pacote_cliente_id")
    .eq("id", agendamento_id)
    .maybeSingle<{ pacote_cliente_id: string | null }>();
  if (!ag?.pacote_cliente_id) return;
  const { data: pc } = await supabase
    .from("pacotes_cliente")
    .select("id, cliente_id, sessoes_usadas, status")
    .eq("id", ag.pacote_cliente_id)
    .maybeSingle<{ id: string; cliente_id: string; sessoes_usadas: number; status: string }>();
  await supabase.from("agendamentos").update({ pacote_cliente_id: null }).eq("id", agendamento_id);
  if (pc) {
    await supabase
      .from("pacotes_cliente")
      .update({ sessoes_usadas: Math.max(0, pc.sessoes_usadas - 1), status: pc.status === "concluido" ? "ativo" : pc.status })
      .eq("id", pc.id);
  }
  revalidar(pc?.cliente_id);
}

export async function cancelarPacote(f: FormData) {
  const { supabase } = await getContexto();
  const id = texto(f, "id");
  if (!id) return;
  const { data } = await supabase
    .from("pacotes_cliente")
    .update({ status: "cancelado" })
    .eq("id", id)
    .select("cliente_id")
    .maybeSingle<{ cliente_id: string }>();
  revalidar(data?.cliente_id);
}
