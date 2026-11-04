"use server";
import { headers } from "next/headers";
import { supabasePublico } from "@/lib/supabase/publico";

export async function enviarAssinaturaLink(token: string, png: string): Promise<string | void> {
  if (!png.startsWith("data:image/png;base64,") || png.length > 700_000) return "Assinatura inválida. Tente novamente.";
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "").split(",")[0].trim();
  const ua = h.get("user-agent") ?? "";
  const { data, error } = await supabasePublico().rpc("assinar_termo_por_token", { p_token: token, p_png: png, p_ip: ip, p_ua: ua });
  if (error) return "Não foi possível enviar. Verifique a internet e tente de novo.";
  if (!data) return "Este link expirou ou o termo já foi assinado.";
}
