import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getContexto } from "@/lib/contexto";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BarraSessoes } from "@/components/BarraSessoes";
import { fmtData, hojeISO } from "@/lib/tempo";
import type { Pacote, Procedimento } from "@/types/database";
import { ModelosPacote } from "./FormModelo";

type Vendido = {
  id: string;
  sessoes_total: number;
  sessoes_usadas: number;
  valido_ate: string | null;
  status: string;
  clientes: { id: string; nome: string } | null;
  pacotes: { nome: string } | null;
};

export default async function PacotesPage() {
  const { supabase } = await getContexto();
  const hoje = hojeISO();
  const [{ data: modelos }, { data: procedimentos }, { data: ativos }] = await Promise.all([
    supabase.from("pacotes").select("*").order("ativo", { ascending: false }).order("nome").returns<Pacote[]>(),
    supabase.from("procedimentos").select("*").eq("ativo", true).order("nome").returns<Procedimento[]>(),
    supabase
      .from("pacotes_cliente")
      .select("id, sessoes_total, sessoes_usadas, valido_ate, status, clientes(id, nome), pacotes(nome)")
      .eq("status", "ativo")
      .order("valido_ate")
      .returns<Vendido[]>(),
  ]);

  const lista = ativos ?? [];
  const vencendo = lista.filter((p) => p.valido_ate && p.valido_ate >= hoje && p.valido_ate <= fmtLimite(hoje));
  const sessoesRestantes = lista.reduce((t, p) => t + (p.sessoes_total - p.sessoes_usadas), 0);

  return (
    <div className="space-y-6">
      <Cabecalho
        titulo="Pacotes"
        descricao={`${lista.length} pacotes ativos · ${sessoesRestantes} sessões a realizar`}
        acao={
          <Link href="/pacotes/vender" className="botao">
            <ShoppingBag size={16} /> Vender pacote
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="cartao-lista lg:col-span-3">
          <div className="border-b border-vinho-borda px-5 py-3">
            <h2 className="font-titulo text-xl font-semibold">Pacotes em andamento</h2>
            {vencendo.length > 0 && <p className="text-xs text-amber-700">{vencendo.length} {vencendo.length === 1 ? "vence" : "vencem"} nos próximos 30 dias</p>}
          </div>
          {lista.length === 0 ? (
            <p className="p-8 text-center text-sm text-vinho-muted">Nenhum pacote ativo.</p>
          ) : (
            <ul className="divide-y divide-vinho-borda">
              {lista.map((p) => {
                const expirado = !!p.valido_ate && p.valido_ate < hoje;
                return (
                  <li key={p.id}>
                    <Link href={`/clientes/${p.clientes?.id}`} className="block px-5 py-3 hover:bg-vinho-fundo">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-medium">{p.clientes?.nome}</p>
                        <p className={`shrink-0 text-xs ${expirado ? "text-red-700" : "text-vinho-muted"}`}>
                          {p.valido_ate ? `${expirado ? "Venceu" : "Até"} ${fmtData(p.valido_ate, "dd/MM/yy")}` : ""}
                        </p>
                      </div>
                      <p className="mb-1.5 truncate text-xs text-vinho-muted">{p.pacotes?.nome ?? "Pacote"}</p>
                      <BarraSessoes usadas={p.sessoes_usadas} total={p.sessoes_total} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="cartao lg:col-span-2">
          <h2 className="mb-2 font-titulo text-xl font-semibold">Pacotes à venda</h2>
          <ModelosPacote modelos={modelos ?? []} procedimentos={procedimentos ?? []} />
        </section>
      </div>
    </div>
  );
}

function fmtLimite(hoje: string) {
  const d = new Date(hoje + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 30);
  return d.toISOString().slice(0, 10);
}
