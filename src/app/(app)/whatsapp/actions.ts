"use server";
import { revalidatePath } from "next/cache";
import { getContexto } from "@/lib/contexto";
import { MODELOS, type TipoMensagem } from "@/lib/mensagens";
import { texto, traduzErro, type Resultado } from "@/lib/resultado";

const TIPOS = Object.keys(MODELOS) as TipoMensagem[];

/** Registra que a mensagem foi aberta no WhatsApp (para não mandar duas vezes). */
export async function registrarEnvio(d: { tipo: TipoMensagem; clienteId: string | null; referenciaId: string | null; numero: string | null; mensagem: string }) {
  const { supabase, clinica } = await getContexto();
  if (!TIPOS.includes(d.tipo)) return;
  await supabase.from("whatsapp_mensagens").insert({
    clinica_id: clinica.id,
    cliente_id: d.clienteId,
    tipo: d.tipo,
    referencia_id: d.referenciaId,
    numero_destino: d.numero,
    mensagem: d.mensagem.slice(0, 2000),
    status: "enviado",
    enviado_em: new Date().toISOString(),
  });
  if (d.tipo === "lembrete" && d.referenciaId) {
    await supabase.from("agendamentos").update({ lembrete_enviado: true }).eq("id", d.referenciaId);
  }
  revalidatePath("/whatsapp");
  revalidatePath("/agenda");
}

export async function salvarModelo(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, clinica } = await getContexto();
  const tipo = texto(f, "tipo") as TipoMensagem | null;
  const msg = texto(f, "mensagem");
  if (!tipo || !TIPOS.includes(tipo)) return { erro: "Tipo inválido." };
  if (!msg) return { erro: "Escreva a mensagem." };
  const { error } = await supabase
    .from("whatsapp_templates")
    .upsert({ clinica_id: clinica.id, tipo, nome: MODELOS[tipo].titulo, mensagem: msg, ativo: true }, { onConflict: "clinica_id,tipo" });
  if (error) return { erro: traduzErro(error.message) };
  revalidatePath("/whatsapp");
  return { ok: "Modelo salvo." };
}

export async function restaurarModelo(f: FormData) {
  const { supabase } = await getContexto();
  const tipo = texto(f, "tipo");
  if (!tipo) return;
  await supabase.from("whatsapp_templates").delete().eq("tipo", tipo);
  revalidatePath("/whatsapp");
}
