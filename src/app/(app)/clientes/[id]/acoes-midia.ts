"use server";
import { revalidatePath } from "next/cache";
import { getContexto } from "@/lib/contexto";

const MOMENTOS = ["antes", "durante", "depois"];

export async function registrarFoto(clienteId: string, path: string, momento: string, regiao: string | null) {
  const { supabase, clinica } = await getContexto();
  // O caminho precisa estar na pasta da clínica e do cliente (a política do storage também garante isso).
  if (!path.startsWith(`${clinica.id}/${clienteId}/`)) return { erro: "Caminho inválido." };
  const { error } = await supabase.from("fotos_evolucao").insert({
    clinica_id: clinica.id,
    cliente_id: clienteId,
    storage_path: path,
    momento: MOMENTOS.includes(momento) ? momento : null,
    regiao: regiao?.trim() || null,
  });
  if (error) {
    await supabase.storage.from("fotos").remove([path]);
    return { erro: error.message };
  }
  revalidatePath(`/clientes/${clienteId}`);
  return { ok: true };
}

export async function excluirFoto(id: string) {
  const { supabase } = await getContexto();
  const { data } = await supabase
    .from("fotos_evolucao")
    .select("storage_path, cliente_id")
    .eq("id", id)
    .maybeSingle<{ storage_path: string; cliente_id: string }>();
  if (!data) return;
  await supabase.storage.from("fotos").remove([data.storage_path]);
  await supabase.from("fotos_evolucao").delete().eq("id", id);
  revalidatePath(`/clientes/${data.cliente_id}`);
}
