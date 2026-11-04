"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContexto } from "@/lib/contexto";
import { numero, texto, traduzErro, type Resultado } from "@/lib/resultado";
import { deLocal, fmt } from "@/lib/tempo";
import type { StatusAgendamento } from "@/types/database";

const STATUS_VALIDOS: StatusAgendamento[] = ["agendado", "confirmado", "em_atendimento", "concluido", "faltou", "cancelado"];

export async function salvarAgendamento(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, clinica } = await getContexto();
  const id = texto(f, "id");
  const cliente_id = texto(f, "cliente_id");
  const profissional_id = texto(f, "profissional_id");
  const procedimento_id = texto(f, "procedimento_id");
  const data = texto(f, "data");
  const hora = texto(f, "hora");
  const duracao = numero(f, "duracao");

  if (!cliente_id) return { erro: "Escolha o cliente." };
  if (!profissional_id) return { erro: "Escolha o profissional." };
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data) || !hora || !/^\d{2}:\d{2}$/.test(hora)) return { erro: "Informe data e horário." };
  if (!duracao || duracao < 5 || duracao > 600) return { erro: "Duração deve ficar entre 5 e 600 minutos." };

  const inicio = deLocal(data, hora);
  const fim = new Date(inicio.getTime() + duracao * 60_000);

  // Conflito: mesmo profissional, horários que se sobrepõem, ainda válidos.
  let conflito = supabase
    .from("agendamentos")
    .select("inicio, fim, clientes(nome)")
    .eq("profissional_id", profissional_id)
    .not("status", "in", "(cancelado,faltou)")
    .lt("inicio", fim.toISOString())
    .gt("fim", inicio.toISOString())
    .limit(1);
  if (id) conflito = conflito.neq("id", id);
  const { data: choque } = await conflito.returns<{ inicio: string; fim: string; clientes: { nome: string } | null }[]>();
  if (choque && choque.length > 0 && texto(f, "forcar") !== "1") {
    const c = choque[0];
    return {
      erro: `Conflito: ${c.clientes?.nome ?? "outro cliente"} já está marcado das ${fmt(c.inicio, "HH:mm")} às ${fmt(c.fim, "HH:mm")} com este profissional. Marque "Permitir encaixe" para agendar mesmo assim.`,
    };
  }

  const dados = {
    cliente_id,
    profissional_id,
    procedimento_id,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    observacoes: texto(f, "observacoes"),
  };
  const { error } = id
    ? await supabase.from("agendamentos").update(dados).eq("id", id)
    : await supabase.from("agendamentos").insert({ ...dados, clinica_id: clinica.id });
  if (error) return { erro: traduzErro(error.message) };

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath(`/clientes/${cliente_id}`);
  redirect(`/agenda?data=${data}`);
}

export async function mudarStatus(f: FormData) {
  const { supabase } = await getContexto();
  const id = texto(f, "id");
  const status = texto(f, "status") as StatusAgendamento | null;
  if (!id || !status || !STATUS_VALIDOS.includes(status)) return;
  await supabase.from("agendamentos").update({ status }).eq("id", id);
  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/clientes", "layout");
  revalidatePath("/whatsapp");
}
