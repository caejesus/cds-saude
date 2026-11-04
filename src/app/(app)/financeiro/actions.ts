"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContexto } from "@/lib/contexto";
import { numero, texto, traduzErro, type Resultado } from "@/lib/resultado";
import { hojeISO } from "@/lib/tempo";
import { formaValida as forma, montarParcelas } from "@/lib/financeiro";

function revalidar(clienteId?: string | null) {
  revalidatePath("/financeiro");
  revalidatePath("/dashboard");
  revalidatePath("/agenda");
  if (clienteId) revalidatePath(`/clientes/${clienteId}`);
}

export async function salvarLancamento(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, clinica } = await getContexto();
  const tipo = texto(f, "tipo");
  const descricao = texto(f, "descricao");
  const total = numero(f, "valor");
  const vencimento = texto(f, "vencimento") ?? hojeISO();
  const parcelas = Math.min(24, Math.max(1, Math.round(numero(f, "parcelas") ?? 1)));
  const pago = texto(f, "pago") === "1";
  const pagoEm = texto(f, "pago_em") ?? hojeISO();
  const cliente_id = texto(f, "cliente_id");

  if (tipo !== "entrada" && tipo !== "saida") return { erro: "Tipo inválido." };
  if (!descricao) return { erro: "Informe a descrição." };
  if (!total || total <= 0) return { erro: "Informe um valor maior que zero." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) return { erro: "Data de vencimento inválida." };

  const linhas = montarParcelas({
    clinica_id: clinica.id,
    tipo,
    descricao,
    total,
    parcelas,
    vencimento,
    categoria: texto(f, "categoria"),
    forma_pagamento: forma(texto(f, "forma_pagamento")),
    primeiraPaga: pago,
    pagoEm,
    cliente_id,
    agendamento_id: texto(f, "agendamento_id"),
  });

  const { error } = await supabase.from("lancamentos").insert(linhas);
  if (error) return { erro: traduzErro(error.message) };
  revalidar(cliente_id);

  const voltar = texto(f, "voltar");
  if (voltar?.startsWith("/")) redirect(voltar);
  redirect(`/financeiro?mes=${vencimento.slice(0, 7)}`);
}

export async function pagarLancamento(f: FormData) {
  const { supabase } = await getContexto();
  const id = texto(f, "id");
  if (!id) return;
  const { data } = await supabase
    .from("lancamentos")
    .update({ status: "pago", pago_em: hojeISO(), forma_pagamento: forma(texto(f, "forma_pagamento")) })
    .eq("id", id)
    .select("cliente_id")
    .maybeSingle<{ cliente_id: string | null }>();
  revalidar(data?.cliente_id);
}

export async function mudarSituacao(f: FormData) {
  const { supabase } = await getContexto();
  const id = texto(f, "id");
  const acao = texto(f, "acao");
  if (!id || (acao !== "cancelar" && acao !== "reabrir")) return;
  const { data } = await supabase
    .from("lancamentos")
    .update(acao === "cancelar" ? { status: "cancelado" } : { status: "pendente", pago_em: null })
    .eq("id", id)
    .select("cliente_id")
    .maybeSingle<{ cliente_id: string | null }>();
  revalidar(data?.cliente_id);
}
