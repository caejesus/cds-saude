import Link from "next/link";
import { CalendarClock, Cake, HeartHandshake, Receipt, ChevronLeft, ChevronRight, PencilLine } from "lucide-react";
import { getContexto } from "@/lib/contexto";
import { brl, telefoneBR } from "@/lib/formato";
import { MODELOS, preencher, type TipoMensagem } from "@/lib/mensagens";
import { dataValida, deLocal, fmt, fmtData, hojeISO, limitesDoDia, somarDias } from "@/lib/tempo";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusAgendamento } from "@/types/database";
import { mudarStatus } from "../agenda/actions";
import { BotaoWhatsApp } from "./BotaoEnviar";
import { Modelos } from "./Modelos";

type Ag = {
  id: string;
  inicio: string;
  status: StatusAgendamento;
  lembrete_enviado: boolean;
  clientes: { id: string; nome: string; whatsapp: string | null; telefone: string | null } | null;
  procedimentos: { nome: string } | null;
  profissionais: { nome: string } | null;
};
type Envio = { tipo: string; referencia_id: string | null; cliente_id: string | null; criado_em: string };

const ABAS = [
  { id: "confirmacoes", rotulo: "Confirmações", icone: CalendarClock },
  { id: "pos", rotulo: "Pós-atendimento", icone: HeartHandshake },
  { id: "aniversarios", rotulo: "Aniversários", icone: Cake },
  { id: "cobrancas", rotulo: "Cobranças", icone: Receipt },
  { id: "modelos", rotulo: "Modelos", icone: PencilLine },
] as const;

const primeiro = (n: string) => n.split(" ")[0];
const numeroDe = (c: { whatsapp: string | null; telefone: string | null } | null) => c?.whatsapp || c?.telefone || null;

export default async function WhatsappPage({ searchParams }: { searchParams: Promise<{ aba?: string; data?: string }> }) {
  const sp = await searchParams;
  const aba = ABAS.some((a) => a.id === sp.aba) ? sp.aba! : "confirmacoes";
  const { supabase, clinica } = await getContexto();
  const hoje = hojeISO();

  // Modelos: personalizados da clínica ou o padrão.
  const { data: salvos } = await supabase.from("whatsapp_templates").select("tipo, mensagem").returns<{ tipo: TipoMensagem; mensagem: string }[]>();
  const textos = Object.fromEntries(
    (Object.keys(MODELOS) as TipoMensagem[]).map((t) => [t, salvos?.find((s) => s.tipo === t)?.mensagem ?? MODELOS[t].texto])
  ) as Record<TipoMensagem, string>;

  const envios = async (tipo: TipoMensagem, desde: string) => {
    const { data } = await supabase
      .from("whatsapp_mensagens")
      .select("tipo, referencia_id, cliente_id, criado_em")
      .eq("tipo", tipo)
      .gte("criado_em", desde)
      .order("criado_em", { ascending: false })
      .returns<Envio[]>();
    return data ?? [];
  };

  let conteudo: React.ReactNode = null;

  if (aba === "confirmacoes" || aba === "pos") {
    const padrao = aba === "confirmacoes" ? somarDias(hoje, 1) : somarDias(hoje, -1);
    const data = dataValida(sp.data ?? padrao);
    const { inicio, fim } = limitesDoDia(data);
    let q = supabase
      .from("agendamentos")
      .select("id, inicio, status, lembrete_enviado, clientes(id, nome, whatsapp, telefone), procedimentos(nome), profissionais(nome)")
      .gte("inicio", inicio)
      .lt("inicio", fim)
      .order("inicio");
    q = aba === "pos" ? q.eq("status", "concluido") : q.not("status", "in", "(cancelado,faltou)");
    const { data: lista } = await q.returns<Ag[]>();
    const itens = lista ?? [];
    const jaEnviados = aba === "pos" ? await envios("pos_atendimento", limitesDoDia(somarDias(data, -1)).inicio) : [];
    const tipo: TipoMensagem = aba === "confirmacoes" ? "lembrete" : "pos_atendimento";
    const pendentes = aba === "confirmacoes" ? itens.filter((a) => !a.lembrete_enviado).length : itens.filter((a) => !jaEnviados.some((e) => e.referencia_id === a.id)).length;
    const titulo = data === somarDias(hoje, 1) ? "Amanhã" : data === hoje ? "Hoje" : data === somarDias(hoje, -1) ? "Ontem" : fmtData(data, "dd/MM");

    conteudo = (
      <section className="cartao-lista">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-vinho-borda px-5 py-3">
          <div>
            <h2 className="font-titulo text-xl font-semibold">
              {titulo} · {fmt(deLocal(data, "12:00"), "EEEE, dd/MM")}
            </h2>
            <p className="text-xs text-vinho-muted">
              {itens.length} {aba === "pos" ? "atendidos" : "agendados"} · {pendentes} {aba === "confirmacoes" ? "sem lembrete" : "sem mensagem"}
            </p>
          </div>
          <nav className="flex items-center rounded-lg border border-vinho-borda">
            <Link href={`/whatsapp?aba=${aba}&data=${somarDias(data, -1)}`} className="p-2 text-vinho-muted hover:text-vinho-acao" aria-label="Dia anterior"><ChevronLeft size={16} /></Link>
            <Link href={`/whatsapp?aba=${aba}&data=${somarDias(data, 1)}`} className="p-2 text-vinho-muted hover:text-vinho-acao" aria-label="Próximo dia"><ChevronRight size={16} /></Link>
          </nav>
        </div>
        {itens.length === 0 ? (
          <p className="p-8 text-center text-sm text-vinho-muted">{aba === "pos" ? "Nenhum atendimento concluído neste dia." : "Nenhum agendamento neste dia."}</p>
        ) : (
          <ul className="divide-y divide-vinho-borda">
            {itens.map((a) => {
              const c = a.clientes;
              const msg = preencher(textos[tipo], {
                nome: c ? primeiro(c.nome) : "",
                clinica: clinica.nome,
                data: fmt(a.inicio, "EEEE, dd/MM"),
                hora: fmt(a.inicio, "HH:mm"),
                procedimento: a.procedimentos?.nome ?? "atendimento",
                profissional: a.profissionais?.nome ?? "",
              });
              const envio = jaEnviados.find((e) => e.referencia_id === a.id);
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="w-12 shrink-0 font-titulo text-lg font-semibold">{fmt(a.inicio, "HH:mm")}</span>
                  <div className="min-w-0 flex-1">
                    {c ? <Link href={`/clientes/${c.id}`} className="block truncate text-sm font-medium hover:text-vinho-acao">{c.nome}</Link> : <p className="text-sm">—</p>}
                    <p className="truncate text-xs text-vinho-muted">
                      {[a.procedimentos?.nome, a.profissionais?.nome, telefoneBR(numeroDe(c))].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {aba === "confirmacoes" && <StatusBadge status={a.status} />}
                  <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
                    <BotaoWhatsApp
                      tipo={tipo}
                      clienteId={c?.id ?? null}
                      referenciaId={a.id}
                      numero={numeroDe(c)}
                      mensagem={msg}
                      enviadoEm={aba === "pos" && envio ? fmt(envio.criado_em, "dd/MM HH:mm") : null}
                      rotulo={aba === "confirmacoes" ? (a.lembrete_enviado ? "Reenviar" : "Enviar lembrete") : "Enviar mensagem"}
                    />
                    {aba === "confirmacoes" && a.status === "agendado" && (
                      <>
                        <form action={mudarStatus}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="status" value="confirmado" />
                          <button className="rounded-md border border-green-200 px-2.5 py-1.5 text-xs text-green-800 hover:bg-green-50">Confirmou</button>
                        </form>
                        <form action={mudarStatus}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="status" value="cancelado" />
                          <button className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50">Cancelou</button>
                        </form>
                        <Link href={`/agenda/novo?editar=${a.id}`} className="rounded-md border border-vinho-borda px-2.5 py-1.5 text-xs text-vinho-muted hover:border-vinho-medio">Remarcar</Link>
                      </>
                    )}
                    {aba === "confirmacoes" && a.lembrete_enviado && a.status === "agendado" && (
                      <span className="text-[11px] text-amber-700">aguardando resposta</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  if (aba === "aniversarios") {
    const { data: clientes } = await supabase
      .from("clientes")
      .select("id, nome, whatsapp, telefone, data_nascimento")
      .eq("ativo", true)
      .not("data_nascimento", "is", null)
      .limit(5000)
      .returns<{ id: string; nome: string; whatsapp: string | null; telefone: string | null; data_nascimento: string }[]>();
    const proximos = Array.from({ length: 8 }, (_, i) => somarDias(hoje, i));
    const lista = (clientes ?? [])
      .map((c) => ({ ...c, dia: proximos.find((d) => d.slice(5) === c.data_nascimento.slice(5)) }))
      .filter((c) => c.dia)
      .sort((a, b) => a.dia!.localeCompare(b.dia!));
    const jaEnviados = await envios("aniversario", limitesDoDia(somarDias(hoje, -10)).inicio);
    conteudo = (
      <section className="cartao-lista">
        <div className="border-b border-vinho-borda px-5 py-3">
          <h2 className="font-titulo text-xl font-semibold">Aniversariantes · próximos 7 dias</h2>
          <p className="text-xs text-vinho-muted">Boa hora para oferecer um mimo ou desconto especial.</p>
        </div>
        {lista.length === 0 ? (
          <p className="p-8 text-center text-sm text-vinho-muted">Nenhum aniversariante nos próximos dias.</p>
        ) : (
          <ul className="divide-y divide-vinho-borda">
            {lista.map((c) => {
              const envio = jaEnviados.find((e) => e.cliente_id === c.id);
              const anos = Number(c.dia!.slice(0, 4)) - Number(c.data_nascimento.slice(0, 4));
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className={`w-14 shrink-0 text-center text-xs font-medium ${c.dia === hoje ? "rounded-full bg-vinho-acao py-1 text-white" : "text-vinho-muted"}`}>
                    {c.dia === hoje ? "Hoje 🎂" : fmtData(c.dia!, "dd/MM")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/clientes/${c.id}`} className="block truncate text-sm font-medium hover:text-vinho-acao">{c.nome}</Link>
                    <p className="text-xs text-vinho-muted">Faz {anos} anos</p>
                  </div>
                  <BotaoWhatsApp
                    tipo="aniversario"
                    clienteId={c.id}
                    referenciaId={null}
                    numero={numeroDe(c)}
                    mensagem={preencher(textos.aniversario, { nome: primeiro(c.nome), clinica: clinica.nome })}
                    enviadoEm={envio ? fmt(envio.criado_em, "dd/MM") : null}
                    rotulo="Dar parabéns"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  if (aba === "cobrancas") {
    const { data: vencidos } = await supabase
      .from("lancamentos")
      .select("id, valor, vencimento, cliente_id, clientes(id, nome, whatsapp, telefone)")
      .eq("tipo", "entrada")
      .eq("status", "pendente")
      .lt("vencimento", hoje)
      .not("cliente_id", "is", null)
      .order("vencimento")
      .returns<{ id: string; valor: number; vencimento: string; cliente_id: string; clientes: { id: string; nome: string; whatsapp: string | null; telefone: string | null } | null }[]>();
    const porCliente = new Map<string, { cliente: NonNullable<(typeof vencidos)>[number]["clientes"]; total: number; maisAntigo: string; qtd: number }>();
    for (const l of vencidos ?? []) {
      const atual = porCliente.get(l.cliente_id) ?? { cliente: l.clientes, total: 0, maisAntigo: l.vencimento, qtd: 0 };
      atual.total += Number(l.valor);
      atual.qtd += 1;
      if (l.vencimento < atual.maisAntigo) atual.maisAntigo = l.vencimento;
      porCliente.set(l.cliente_id, atual);
    }
    const lista = [...porCliente.entries()].sort((a, b) => a[1].maisAntigo.localeCompare(b[1].maisAntigo));
    const jaEnviados = await envios("cobranca", limitesDoDia(somarDias(hoje, -30)).inicio);
    conteudo = (
      <section className="cartao-lista">
        <div className="border-b border-vinho-borda px-5 py-3">
          <h2 className="font-titulo text-xl font-semibold">Cobranças em atraso</h2>
          <p className="text-xs text-vinho-muted">
            {lista.length} {lista.length === 1 ? "cliente" : "clientes"} · {brl(lista.reduce((t, [, v]) => t + v.total, 0))} no total
          </p>
        </div>
        {lista.length === 0 ? (
          <p className="p-8 text-center text-sm text-vinho-muted">Nenhuma cobrança em atraso. 👏</p>
        ) : (
          <ul className="divide-y divide-vinho-borda">
            {lista.map(([id, v]) => {
              const envio = jaEnviados.find((e) => e.cliente_id === id);
              const dias = Math.round((deLocal(hoje).getTime() - deLocal(v.maisAntigo).getTime()) / 86_400_000);
              return (
                <li key={id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/clientes/${id}`} className="block truncate text-sm font-medium hover:text-vinho-acao">{v.cliente?.nome}</Link>
                    <p className="text-xs text-vinho-muted">
                      {v.qtd} {v.qtd === 1 ? "parcela" : "parcelas"} · vencido há {dias} {dias === 1 ? "dia" : "dias"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-red-700">{brl(v.total)}</span>
                  <BotaoWhatsApp
                    tipo="cobranca"
                    clienteId={id}
                    referenciaId={null}
                    numero={numeroDe(v.cliente)}
                    mensagem={preencher(textos.cobranca, { nome: primeiro(v.cliente?.nome ?? ""), clinica: clinica.nome, valor: brl(v.total), vencimento: fmtData(v.maisAntigo) })}
                    enviadoEm={envio ? fmt(envio.criado_em, "dd/MM") : null}
                    rotulo="Cobrar"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  if (aba === "modelos") {
    conteudo = <Modelos textos={textos} personalizados={(salvos ?? []).map((s) => s.tipo)} />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-titulo text-3xl font-semibold sm:text-4xl">WhatsApp</h1>
        <p className="mt-1 text-sm text-vinho-muted">Mensagens prontas: clique, o WhatsApp abre com o texto, é só enviar.</p>
      </header>
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {ABAS.map(({ id, rotulo, icone: Icone }) => (
          <Link
            key={id}
            href={`/whatsapp?aba=${id}`}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm ${aba === id ? "bg-vinho-acao text-white" : "bg-white text-vinho-muted ring-1 ring-vinho-borda hover:text-vinho-acao"}`}
          >
            <Icone size={15} /> {rotulo}
          </Link>
        ))}
      </nav>
      {conteudo}
    </div>
  );
}
