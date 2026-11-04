import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getContexto } from "@/lib/contexto";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { dataValida, fmt } from "@/lib/tempo";
import type { Agendamento, Procedimento, Profissional } from "@/types/database";
import { FormAgendamento, type Inicial } from "./FormAgendamento";

export default async function NovoAgendamentoPage({ searchParams }: {
  searchParams: Promise<{ data?: string; hora?: string; cliente?: string; prof?: string; editar?: string }>;
}) {
  const sp = await searchParams;
  const { supabase } = await getContexto();

  const [{ data: clientes }, { data: profissionais }, { data: procedimentos }, { data: existente }] = await Promise.all([
    supabase.from("clientes").select("id, nome, alergias").eq("ativo", true).order("nome").limit(2000)
      .returns<{ id: string; nome: string; alergias: string | null }[]>(),
    supabase.from("profissionais").select("*").eq("ativo", true).order("nome").returns<Profissional[]>(),
    supabase.from("procedimentos").select("*").eq("ativo", true).order("nome").returns<Procedimento[]>(),
    sp.editar
      ? supabase.from("agendamentos").select("*").eq("id", sp.editar).maybeSingle<Agendamento>()
      : Promise.resolve({ data: null }),
  ]);

  const inicial: Inicial = existente
    ? {
        id: existente.id,
        cliente_id: existente.cliente_id,
        profissional_id: existente.profissional_id ?? undefined,
        procedimento_id: existente.procedimento_id ?? undefined,
        data: fmt(existente.inicio, "yyyy-MM-dd"),
        hora: fmt(existente.inicio, "HH:mm"),
        duracao: Math.round((new Date(existente.fim).getTime() - new Date(existente.inicio).getTime()) / 60_000),
        observacoes: existente.observacoes ?? undefined,
      }
    : {
        cliente_id: sp.cliente,
        profissional_id: sp.prof,
        data: dataValida(sp.data),
        hora: sp.hora && /^\d{2}:\d{2}$/.test(sp.hora) ? sp.hora : "09:00",
      };

  const semProfissional = (profissionais ?? []).length === 0;

  return (
    <div className="max-w-3xl space-y-6">
      <Link href={`/agenda?data=${inicial.data}`} className="inline-flex items-center gap-1 text-sm text-vinho-muted hover:text-vinho-acao">
        <ArrowLeft size={16} /> Agenda
      </Link>
      <Cabecalho titulo={existente ? "Remarcar atendimento" : "Novo agendamento"} />
      <section className="cartao">
        {semProfissional ? (
          <p className="text-sm text-vinho-muted">
            Cadastre pelo menos um profissional em{" "}
            <Link href="/configuracoes" className="font-medium text-vinho-acao hover:underline">Configurações</Link>{" "}
            antes de agendar.
          </p>
        ) : (
          <FormAgendamento clientes={clientes ?? []} profissionais={profissionais ?? []} procedimentos={procedimentos ?? []} inicial={inicial} />
        )}
      </section>
    </div>
  );
}
