"use server";
import { revalidatePath } from "next/cache";
import { getContexto } from "@/lib/contexto";
import { numero, texto, traduzErro, type Resultado } from "@/lib/resultado";

export async function salvarClinica(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, clinica, usuario } = await getContexto();
  if (usuario.perfil !== "admin") return { erro: "Só o administrador pode alterar os dados da clínica." };
  const nome = texto(f, "nome");
  if (!nome) return { erro: "Informe o nome da clínica." };
  const { error } = await supabase
    .from("clinicas")
    .update({
      nome,
      cnpj: texto(f, "cnpj"),
      telefone: texto(f, "telefone"),
      email: texto(f, "email"),
      endereco: texto(f, "endereco"),
      cidade: texto(f, "cidade"),
      estado: texto(f, "estado"),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", clinica.id);
  if (error) return { erro: traduzErro(error.message) };
  revalidatePath("/", "layout");
  return { ok: "Dados da clínica salvos." };
}

export async function salvarProfissional(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, clinica } = await getContexto();
  const id = texto(f, "id");
  const nome = texto(f, "nome");
  if (!nome) return { erro: "Informe o nome do profissional." };
  const dados = {
    nome,
    especialidade: texto(f, "especialidade"),
    registro: texto(f, "registro"),
    telefone: texto(f, "telefone"),
    cor_agenda: texto(f, "cor_agenda") ?? "#7D1635",
  };
  const { error } = id
    ? await supabase.from("profissionais").update(dados).eq("id", id)
    : await supabase.from("profissionais").insert({ ...dados, clinica_id: clinica.id });
  if (error) return { erro: traduzErro(error.message) };
  revalidatePath("/configuracoes");
  revalidatePath("/agenda");
  return { ok: id ? "Profissional atualizado." : "Profissional cadastrado." };
}

export async function salvarProcedimento(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, clinica } = await getContexto();
  const id = texto(f, "id");
  const nome = texto(f, "nome");
  const duracao = numero(f, "duracao_minutos");
  const valor = numero(f, "valor") ?? 0;
  if (!nome) return { erro: "Informe o nome do procedimento." };
  if (!duracao || duracao < 5 || duracao > 600) return { erro: "Duração deve ficar entre 5 e 600 minutos." };
  if (valor < 0) return { erro: "Valor não pode ser negativo." };
  const dados = { nome, categoria: texto(f, "categoria"), duracao_minutos: Math.round(duracao), valor };
  const { error } = id
    ? await supabase.from("procedimentos").update(dados).eq("id", id)
    : await supabase.from("procedimentos").insert({ ...dados, clinica_id: clinica.id });
  if (error) return { erro: traduzErro(error.message) };
  revalidatePath("/configuracoes");
  return { ok: id ? "Procedimento atualizado." : "Procedimento cadastrado." };
}

export async function alternarAtivo(f: FormData) {
  const { supabase } = await getContexto();
  const tabela = texto(f, "tabela");
  const id = texto(f, "id");
  if (!id || (tabela !== "profissionais" && tabela !== "procedimentos")) return;
  await supabase.from(tabela).update({ ativo: texto(f, "ativo") === "true" }).eq("id", id);
  revalidatePath("/configuracoes");
}

/** Grava (ou remove, com url = null) a logo enviada para o bucket público "marca". */
export async function salvarLogo(url: string | null): Promise<string | void> {
  const { supabase, clinica, usuario } = await getContexto();
  if (usuario.perfil !== "admin") return "Só o administrador pode trocar a logo.";
  if (url && !url.includes(`/storage/v1/object/public/marca/${clinica.id}/`)) return "Endereço de logo inválido.";
  const antiga = clinica.logo_url?.split(`/marca/`)[1];
  const { error } = await supabase.from("clinicas").update({ logo_url: url, atualizado_em: new Date().toISOString() }).eq("id", clinica.id);
  if (error) return traduzErro(error.message);
  if (antiga && antiga !== url?.split(`/marca/`)[1]) await supabase.storage.from("marca").remove([antiga]);
  revalidatePath("/", "layout");
}
