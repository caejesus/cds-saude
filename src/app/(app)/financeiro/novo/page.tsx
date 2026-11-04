import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getContexto } from "@/lib/contexto";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { fmt, hojeISO } from "@/lib/tempo";
import { FormLancamento, type InicialLancamento } from "./FormLancamento";

type AgendamentoReceber = {
  id: string;
  inicio: string;
  cliente_id: string;
  clientes: { nome: string } | null;
  procedimentos: { nome: string; valor: number } | null;
};

export default async function NovoLancamentoPage({ searchParams }: {
  searchParams: Promise<{ tipo?: string; agendamento?: string; cliente?: string; voltar?: string }>;
}) {
  const sp = await searchParams;
  const { supabase } = await getContexto();
  const hoje = hojeISO();

  const [{ data: clientes }, { data: ag }] = await Promise.all([
    supabase.from("clientes").select("id, nome").eq("ativo", true).order("nome").limit(2000).returns<{ id: string; nome: string }[]>(),
    sp.agendamento
      ? supabase
          .from("agendamentos")
          .select("id, inicio, cliente_id, clientes(nome), procedimentos(nome, valor)")
          .eq("id", sp.agendamento)
          .maybeSingle<AgendamentoReceber>()
      : Promise.resolve({ data: null }),
  ]);

  const voltar = sp.voltar?.startsWith("/") ? sp.voltar : undefined;
  const inicial: InicialLancamento = ag
    ? {
        tipo: "entrada",
        descricao: ag.procedimentos?.nome ?? "Atendimento",
        valor: ag.procedimentos ? Number(ag.procedimentos.valor) : undefined,
        categoria: "Procedimentos",
        cliente_id: ag.cliente_id,
        agendamento_id: ag.id,
        vencimento: fmt(ag.inicio, "yyyy-MM-dd"),
        hoje,
        pago: true,
        voltar,
      }
    : { tipo: sp.tipo === "saida" ? "saida" : "entrada", cliente_id: sp.cliente, vencimento: hoje, hoje, voltar };

  return (
    <div className="max-w-3xl space-y-6">
      <Link href={voltar ?? "/financeiro"} className="inline-flex items-center gap-1 text-sm text-vinho-muted hover:text-vinho-acao">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <Cabecalho titulo={ag ? "Receber atendimento" : "Novo lançamento"} descricao={ag ? `${fmt(ag.inicio, "dd/MM 'às' HH:mm")}` : undefined} />
      <section className="cartao">
        <FormLancamento inicial={inicial} clientes={clientes ?? []} />
      </section>
    </div>
  );
}
