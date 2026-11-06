import { cache } from "react";
import { supabasePublico } from "./publico";

/** Nome e logo da clínica para páginas sem login (login, assinatura por link). */
export const marcaPublica = cache(async (): Promise<{ nome: string | null; logo_url: string | null }> => {
  try {
    const { data } = await supabasePublico().rpc("marca_publica");
    return (data as { nome: string; logo_url: string | null }) ?? { nome: null, logo_url: null };
  } catch {
    return { nome: null, logo_url: null };
  }
});
