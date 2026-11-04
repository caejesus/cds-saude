import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getContexto } from "@/lib/contexto";
import { dataValida, fmt, hojeISO, limitesDoDia, deLocal, somarDias } from "@/lib/tempo";
import type { Profissional } from "@/types/database";
import { CartaoAgendamento, type ItemAgenda, type PacoteAtivo } from "./CartaoAgendamento";

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const data = dataValida((await searchParams).data);
  const hoje = hojeISO();
  const { supabase, clinica } = await getContexto();
  const { inicio, fim } = limitesDoDia(data);

  const [{ data: profissionais }, { data: itens }] = await Promise.all([
    supabase.from("profissionais").select("*").eq("ativo", true).order("nome").returns<Profissional[]>(),
    supabase
      .from("agendamentos")
      .select("id, inicio, fim, status, observacoes, profissional_id, procedimento_id, pacote_cliente_id, clientes(id, nome, alergias, whatsapp, telefone), procedimentos(nome)")
      .gte("inicio", inicio)
      .lt("inicio", fim)
      .order("inicio")
      .returns<ItemAgenda[]>(),
  ]);

  const lista = itens ?? [];
  const { data: pagos } = lista.length
    ? await supabase
        .from("lancamentos")
        .select("agendamento_id, status")
        .in("agendamento_id", lista.map((a) => a.id))
        .neq("status", "cancelado")
        .returns<{ agendamento_id: string; status: "pago" | "pendente" }[]>()
    : { data: [] };
  const financeiro = new Map((pagos ?? []).map((x) => [x.agendamento_id, x.status]));
  const idsClientes = [...new Set(lista.map((a) => a.clientes?.id).filter((x): x is string => !!x))];
  const { data: pacotesAtivos } = idsClientes.length
    ? await supabase
        .from("pacotes_cliente")
        .select("id, cliente_id, sessoes_total, sessoes_usadas, valido_ate, pacotes(nome, procedimento_id)")
        .in("cliente_id", idsClientes)
        .eq("status", "ativo")
        .returns<PacoteAtivo[]>()
    : { data: [] };
  const pacoteDisponivel = (a: ItemAgenda) =>
    (pacotesAtivos ?? []).find(
      (p) =>
        p.cliente_id === a.clientes?.id &&
        p.sessoes_usadas < p.sessoes_total &&
        (!p.valido_ate || p.valido_ate >= hoje) &&
        (!p.pacotes?.procedimento_id || p.pacotes.procedimento_id === a.procedimento_id)
    );
  const profs = profissionais ?? [];
  // Colunas: profissionais ativos + quem tem horário no dia mas foi desativado.
  const colunas: { id: string | null; nome: string; cor: string }[] = profs.map((p) => ({ id: p.id, nome: p.nome, cor: p.cor_agenda }));
  if (lista.some((a) => a.profissional_id && !profs.find((p) => p.id === a.profissional_id)))
    colunas.push({ id: "__outros", nome: "Outros", cor: "#9e7080" });
  if (lista.some((a) => !a.profissional_id)) colunas.push({ id: null, nome: "Sem profissional", cor: "#9e7080" });

  const daColuna = (id: string | null) =>
    lista.filter((a) =>
      id === "__outros" ? a.profissional_id && !profs.find((p) => p.id === a.profissional_id) : a.profissional_id === id
    );

  const ativos = lista.filter((a) => a.status !== "cancelado" && a.status !== "faltou").length;
  const titulo = data === hoje ? "Hoje" : data === somarDias(hoje, 1) ? "Amanhã" : fmt(deLocal(data), "EEEE");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-titulo text-3xl font-semibold capitalize sm:text-4xl">{titulo}</h1>
          <p className="mt-1 text-sm text-vinho-muted">
            {fmt(deLocal(data), "d 'de' MMMM 'de' yyyy")} · {ativos} {ativos === 1 ? "atendimento" : "atendimentos"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex items-center rounded-lg border border-vinho-borda bg-white">
            <Link href={`/agenda?data=${somarDias(data, -1)}`} className="p-2 text-vinho-muted hover:text-vinho-acao" aria-label="Dia anterior">
              <ChevronLeft size={18} />
            </Link>
            <Link href={`/agenda?data=${hoje}`} className="border-x border-vinho-borda px-3 py-1.5 text-sm hover:text-vinho-acao">
              Hoje
            </Link>
            <Link href={`/agenda?data=${somarDias(data, 1)}`} className="p-2 text-vinho-muted hover:text-vinho-acao" aria-label="Próximo dia">
              <ChevronRight size={18} />
            </Link>
          </nav>
          <form className="flex items-center gap-1">
            <input type="date" name="data" defaultValue={data} className="campo w-auto py-1.5" aria-label="Ir para data" />
            <button className="botao-sec py-1.5">Ir</button>
          </form>
          <Link href={`/agenda/novo?data=${data}`} className="botao">
            <Plus size={16} /> Agendar
          </Link>
        </div>
      </header>

      {colunas.length === 0 ? (
        <div className="cartao text-center text-sm text-vinho-muted">
          Para usar a agenda, cadastre os profissionais e procedimentos em{" "}
          <Link href="/configuracoes" className="font-medium text-vinho-acao hover:underline">Configurações</Link>.
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))` }}>
          {colunas.map((col) => {
            const doProf = daColuna(col.id);
            return (
              <section key={col.id ?? "sem"} className="flex flex-col rounded-xl bg-white/60 p-3 ring-1 ring-vinho-borda">
                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                  <h2 className="flex min-w-0 items-center gap-2 text-sm font-medium">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: col.cor }} />
                    <span className="truncate">{col.nome}</span>
                  </h2>
                  {col.id && col.id !== "__outros" && (
                    <Link href={`/agenda/novo?data=${data}&prof=${col.id}`} className="rounded-md p-1 text-vinho-muted hover:bg-vinho-fundo hover:text-vinho-acao" aria-label={`Agendar com ${col.nome}`}>
                      <Plus size={16} />
                    </Link>
                  )}
                </div>
                <div className="space-y-2">
                  {doProf.length === 0 ? (
                    <p className="px-1 py-6 text-center text-xs text-vinho-muted">Livre o dia todo</p>
                  ) : (
                    doProf.map((a) => (
                      <CartaoAgendamento key={a.id} a={a} cor={profs.find((p) => p.id === a.profissional_id)?.cor_agenda ?? col.cor} nomeClinica={clinica.nome} financeiro={financeiro.get(a.id)} data={data} pacote={pacoteDisponivel(a)} />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
