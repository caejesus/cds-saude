"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getContexto } from "@/lib/contexto";
import { texto, traduzErro, type Resultado } from "@/lib/resultado";

export async function criarTermo(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, clinica } = await getContexto();
  const cliente_id = texto(f, "cliente_id");
  const txt = texto(f, "texto");
  if (!cliente_id) return { erro: "Cliente inválido." };
  if (!txt || txt.length < 50) return { erro: "O texto do termo está muito curto." };
  const { data, error } = await supabase
    .from("termos_consentimento")
    .insert({ clinica_id: clinica.id, cliente_id, procedimento_id: texto(f, "procedimento_id"), texto: txt })
    .select("id")
    .single();
  if (error) return { erro: traduzErro(error.message) };
  revalidatePath(`/clientes/${cliente_id}`);
  redirect(`/termos/${data.id}`);
}

/** Assinatura feita no aparelho da clínica (tablet/computador). */
export async function assinarPresencial(id: string, png: string): Promise<string | void> {
  const { supabase } = await getContexto();
  if (!png.startsWith("data:image/png;base64,") || png.length > 700_000) return "Assinatura inválida.";
  const h = await headers();
  const { data, error } = await supabase
    .from("termos_consentimento")
    .update({
      aceito_em: new Date().toISOString(),
      assinatura_png: png,
      assinado_via: "presencial",
      assinado_ip: (h.get("x-forwarded-for") ?? "").split(",")[0].trim().slice(0, 100) || null,
      assinado_user_agent: (h.get("user-agent") ?? "").slice(0, 300) || null,
    })
    .eq("id", id)
    .is("aceito_em", null)
    .select("cliente_id")
    .maybeSingle<{ cliente_id: string }>();
  if (error) return traduzErro(error.message);
  if (!data) return "Este termo já foi assinado.";
  revalidatePath(`/termos/${id}`);
  revalidatePath(`/clientes/${data.cliente_id}`);
}

/** Gera um link novo (o anterior deixa de funcionar) válido por 48 horas. */
export async function renovarLink(id: string) {
  const { supabase } = await getContexto();
  await supabase
    .from("termos_consentimento")
    .update({ token: crypto.randomUUID(), token_expira_em: new Date(Date.now() + 48 * 3_600_000).toISOString() })
    .eq("id", id)
    .is("aceito_em", null);
  revalidatePath(`/termos/${id}`);
}

/** Usado pela tela do termo enquanto espera a assinatura pelo link. */
export async function termoFoiAssinado(id: string) {
  const { supabase } = await getContexto();
  const { data } = await supabase.from("termos_consentimento").select("aceito_em").eq("id", id).maybeSingle<{ aceito_em: string | null }>();
  return !!data?.aceito_em;
}
