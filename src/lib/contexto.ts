import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Clinica, Usuario } from "@/types/database";

/** Usuário logado + clínica dele. Redireciona se faltar algo. */
export const getContexto = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Usuario>();
  if (!usuario) redirect("/onboarding");

  const { data: clinica } = await supabase
    .from("clinicas")
    .select("*")
    .eq("id", usuario.clinica_id)
    .single<Clinica>();
  if (!clinica) redirect("/onboarding");

  return { supabase, user, usuario, clinica };
});
