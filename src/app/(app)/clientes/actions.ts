"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContexto } from "@/lib/contexto";
import { texto, traduzErro, type Resultado } from "@/lib/resultado";

const soDigitos = (v: string | null) => (v ? v.replace(/\D/g, "") || null : null);

function dadosCliente(f: FormData) {
  return {
    nome: texto(f, "nome"),
    cpf: soDigitos(texto(f, "cpf")),
    data_nascimento: texto(f, "data_nascimento"),
    telefone: soDigitos(texto(f, "telefone")),
    whatsapp: soDigitos(texto(f, "whatsapp")),
    email: texto(f, "email"),
    endereco: texto(f, "endereco"),
    alergias: texto(f, "alergias"),
    observacoes: texto(f, "observacoes"),
  };
}

export async function criarCliente(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, clinica } = await getContexto();
  const dados = dadosCliente(f);
  if (!dados.nome) return { erro: "Informe o nome do cliente." };
  const { data, error } = await supabase
    .from("clientes")
    .insert({ ...dados, clinica_id: clinica.id })
    .select("id")
    .single();
  if (error) return { erro: traduzErro(error.message) };
  revalidatePath("/clientes");
  const voltar = texto(f, "voltar");
  redirect(voltar === "agenda" ? `/agenda/novo?cliente=${data.id}` : `/clientes/${data.id}`);
}

export async function atualizarCliente(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase } = await getContexto();
  const id = texto(f, "id");
  const dados = dadosCliente(f);
  if (!id) return { erro: "Cliente inválido." };
  if (!dados.nome) return { erro: "Informe o nome do cliente." };
  const { error } = await supabase.from("clientes").update(dados).eq("id", id);
  if (error) return { erro: traduzErro(error.message) };
  revalidatePath(`/clientes/${id}`);
  revalidatePath("/clientes");
  return { ok: "Dados salvos." };
}

export async function adicionarEvolucao(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, clinica } = await getContexto();
  const cliente_id = texto(f, "cliente_id");
  const txt = texto(f, "texto");
  if (!cliente_id || !txt) return { erro: "Escreva a anotação antes de salvar." };
  const { error } = await supabase.from("evolucoes").insert({
    clinica_id: clinica.id,
    cliente_id,
    texto: txt,
    profissional_id: texto(f, "profissional_id"),
  });
  if (error) return { erro: traduzErro(error.message) };
  revalidatePath(`/clientes/${cliente_id}`);
  return { ok: "Anotação registrada." };
}

export async function alternarCliente(f: FormData) {
  const { supabase } = await getContexto();
  const id = texto(f, "id");
  if (!id) return;
  await supabase.from("clientes").update({ ativo: texto(f, "ativo") === "true" }).eq("id", id);
  revalidatePath(`/clientes/${id}`);
  revalidatePath("/clientes");
}
