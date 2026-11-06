import Link from "next/link";
import { BellRing, Cake, FileSignature, Package, Receipt } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { brl } from "@/lib/formato";
import { limitesDoDia, somarDias } from "@/lib/tempo";

/** Avisos do dia no topo do dashboard. Só aparecem os que têm algo pendente. */
export async function AlertasDashboard({ supabase, hoje }: { supabase: SupabaseClient; hoje: string }) {
  const amanha = limitesDoDia(somarDias(hoje, 1));
  const [lembretes, nasc, vencidos, pacotes, termos] = await Promise.all([
    supabase.from("agendamentos").select("id", { count: "exact", head: true })
      .gte("inicio", amanha.inicio).lt("inicio", amanha.fim).eq("status", "agendado").eq("lembrete_enviado", false),
    supabase.from("clientes").select("data_nascimento").eq("ativo", true).not("data_nascimento", "is", null).limit(5000)
      .returns<{ data_nascimento: string }[]>(),
    supabase.from("lancamentos").select("valor, cliente_id").eq("tipo", "entrada").eq("status", "pendente").lt("vencimento", hoje)
      .returns<{ valor: number; cliente_id: string | null }[]>(),
    supabase.from("pacotes_cliente").select("id", { count: "exact", head: true })
      .eq("status", "ativo").gte("valido_ate", hoje).lte("valido_ate", somarDias(hoje, 15)),
    supabase.from("termos_consentimento").select("id", { count: "exact", head: true }).is("aceito_em", null),
  ]);

  const aniversarios = (nasc.data ?? []).filter((c) => c.data_nascimento.slice(5) === hoje.slice(5)).length;
  const totalVencido = (vencidos.data ?? []).reduce((t, l) => t + Number(l.valor), 0);
  const clientesDevendo = new Set((vencidos.data ?? []).map((l) => l.cliente_id).filter(Boolean)).size;

  const itens = [
    { n: lembretes.count ?? 0, icone: BellRing, cor: "text-amber-700 bg-amber-50 ring-amber-200", href: "/whatsapp?aba=confirmacoes",
      texto: (n: number) => `${n} ${n === 1 ? "lembrete pendente" : "lembretes pendentes"} para amanhã` },
    { n: aniversarios, icone: Cake, cor: "text-pink-700 bg-pink-50 ring-pink-200", href: "/whatsapp?aba=aniversarios",
      texto: (n: number) => `${n} ${n === 1 ? "aniversariante" : "aniversariantes"} hoje` },
    { n: clientesDevendo, icone: Receipt, cor: "text-red-700 bg-red-50 ring-red-200", href: "/whatsapp?aba=cobrancas",
      texto: (n: number) => `${brl(totalVencido)} vencido (${n} ${n === 1 ? "cliente" : "clientes"})` },
    { n: pacotes.count ?? 0, icone: Package, cor: "text-violet-700 bg-violet-50 ring-violet-200", href: "/pacotes",
      texto: (n: number) => `${n} ${n === 1 ? "pacote vence" : "pacotes vencem"} em 15 dias` },
    { n: termos.count ?? 0, icone: FileSignature, cor: "text-sky-700 bg-sky-50 ring-sky-200", href: "/clientes",
      texto: (n: number) => `${n} ${n === 1 ? "termo aguardando" : "termos aguardando"} assinatura` },
  ].filter((i) => i.n > 0);

  if (!itens.length) return null;
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Avisos">
      {itens.map(({ n, icone: Icone, cor, href, texto }) => (
        <Link key={href + n} href={href} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition hover:brightness-95 ${cor}`}>
          <Icone size={14} /> {texto(n)}
        </Link>
      ))}
    </nav>
  );
}
