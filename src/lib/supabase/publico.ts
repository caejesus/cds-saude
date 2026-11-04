import { createClient } from "@supabase/supabase-js";

/** Cliente sem login (chave pública). Só acessa funções liberadas para "anon". */
export const supabasePublico = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

export type TermoPublico = {
  id: string;
  texto: string;
  aceito_em: string | null;
  expira_em: string | null;
  assinatura: string | null;
  cliente: string;
  cpf: string | null;
  procedimento: string | null;
  clinica: { nome: string; cnpj: string | null; endereco: string | null; cidade: string | null; estado: string | null; telefone: string | null };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function buscarTermoPublico(token: string) {
  if (!UUID.test(token)) return null;
  const { data, error } = await supabasePublico().rpc("termo_por_token", { p_token: token });
  if (error || !data) return null;
  return data as TermoPublico;
}
