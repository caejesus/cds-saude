import Link from "next/link";
import { AlertCircle, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { getContexto } from "@/lib/contexto";
import { brl, FORMAS } from "@/lib/formato";
import { fmt, fmtData, hojeISO, limitesDoMes, mesValido, somarMeses } from "@/lib/tempo";
import { LinhaLancamento, type LinhaFin } from "./LinhaLancamento";
import { PdfCaixa } from "./PdfCaixa";
import { PdfMovimentos } from "./PdfMovimentos";
import type { MovimentoPdf } from "@/lib/pdf/movimentos";
import { clinicaParaPdf } from "@/lib/pdf/clinica";

const CAMPOS = "id, numero, tipo, descricao, valor, categoria, forma_pagamento, vencimento, pago_em, status, cliente_id, clientes(nome), usuarios(nome)";
const soma = (l: LinhaFin[]) => l.reduce((t, x) => t + Number(x.valor), 0);

function paraPdf(l: LinhaFin, hoje: string): MovimentoPdf {
  const data = l.pago_em ?? l.vencimento;
  const situacao =
    l.status === "pago" ? "Pago" : l.status === "cancelado" ? "Cancelado" : l.vencimento && l.vencimento < hoje ? "Vencido" : "Pendente";
  return {
    numero: l.numero,
    data: data ? fmtData(data) : "—",
    usuario: l.usuarios?.nome ?? null,
    descricao: l.descricao,
    cliente: l.clientes?.nome ?? null,
    tipo: l.tipo,
    forma: l.forma_pagamento ? FORMAS[l.forma_pagamento] : null,
    situacao,
    valor: Number(l.valor),
  };
}

export default async function FinanceiroPage({ searchParams }: { searchParams: Promise<{ mes?: string; filtro?: string }> }) {
  const sp = await searchParams;
  const mes = mesValido(sp.mes);
  const filtro = sp.filtro ?? "todos";
  const hoje = hojeISO();
  const { inicio, fim } = limitesDoMes(mes);
  const { supabase, clinica, usuario } = await getContexto();

  const [{ data: doMes }, { data: vencidos }, { data: hojeLanc }] = await Promise.all([
    supabase
      .from("lancamentos")
      .select(CAMPOS)
      .or(`and(pago_em.gte.${inicio},pago_em.lt.${fim}),and(pago_em.is.null,vencimento.gte.${inicio},vencimento.lt.${fim})`)
      .returns<LinhaFin[]>(),
    supabase.from("lancamentos").select(CAMPOS).eq("status", "pendente").lt("vencimento", hoje).order("vencimento").limit(50).returns<LinhaFin[]>(),
    supabase.from("lancamentos").select(CAMPOS).eq("status", "pago").eq("pago_em", hoje).returns<LinhaFin[]>(),
  ]);

  const mesL = (doMes ?? []).filter((l) => l.status !== "cancelado");
  const recebido = soma(mesL.filter((l) => l.tipo === "entrada" && l.status === "pago"));
  const aReceber = soma(mesL.filter((l) => l.tipo === "entrada" && l.status === "pendente"));
  const despesas = soma(mesL.filter((l) => l.tipo === "saida" && l.status === "pago"));
  const aPagar = soma(mesL.filter((l) => l.tipo === "saida" && l.status === "pendente"));

  const ref = (l: LinhaFin) => l.pago_em ?? l.vencimento ?? "";
  const lista = (doMes ?? [])
    .filter((l) =>
      filtro === "entradas" ? l.tipo === "entrada" : filtro === "saidas" ? l.tipo === "saida" : filtro === "pendentes" ? l.status === "pendente" : true
    )
    .sort((a, b) => ref(b).localeCompare(ref(a)));

  const caixa = hojeLanc ?? [];
  const porForma = Object.keys(FORMAS)
    .map((f) => {
      const itens = caixa.filter((l) => (l.forma_pagamento ?? "outro") === f);
      return { f, entra: soma(itens.filter((l) => l.tipo === "entrada")), sai: soma(itens.filter((l) => l.tipo === "saida")) };
    })
    .filter((x) => x.entra || x.sai);
  const saldoDia = soma(caixa.filter((l) => l.tipo === "entrada")) - soma(caixa.filter((l) => l.tipo === "saida"));
  const vencidosEntrada = (vencidos ?? []).filter((l) => l.tipo === "entrada");
  const vencidosSaida = (vencidos ?? []).filter((l) => l.tipo === "saida");

  const filtros = [
    ["todos", "Todos"],
    ["entradas", "Entradas"],
    ["saidas", "Saídas"],
    ["pendentes", "Pendentes"],
  ];
  const nomeMes = fmtData(`${mes}-01`, "MMMM 'de' yyyy");
  const tituloMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 no-print">
        <div>
          <h1 className="font-titulo text-3xl font-semibold sm:text-4xl">Financeiro</h1>
          <p className="mt-1 text-sm text-vinho-muted">{tituloMes}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex items-center rounded-lg border border-vinho-borda bg-white">
            <Link href={`/financeiro?mes=${somarMeses(mes, -1)}`} className="p-2 text-vinho-muted hover:text-vinho-acao" aria-label="Mês anterior">
              <ChevronLeft size={18} />
            </Link>
            <Link href="/financeiro" className="border-x border-vinho-borda px-3 py-1.5 text-sm hover:text-vinho-acao">Este mês</Link>
            <Link href={`/financeiro?mes=${somarMeses(mes, 1)}`} className="p-2 text-vinho-muted hover:text-vinho-acao" aria-label="Próximo mês">
              <ChevronRight size={18} />
            </Link>
          </nav>
          <Link href="/financeiro/novo?tipo=saida" className="botao-sec"><Minus size={16} /> Despesa</Link>
          <Link href="/financeiro/novo" className="botao"><Plus size={16} /> Entrada</Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 no-print">
        <div className="cartao">
          <p className="text-xs text-vinho-muted">Recebido</p>
          <p className="mt-1 font-titulo text-2xl font-semibold text-green-700 sm:text-3xl">{brl(recebido)}</p>
        </div>
        <div className="cartao">
          <p className="text-xs text-vinho-muted">A receber no mês</p>
          <p className="mt-1 font-titulo text-2xl font-semibold sm:text-3xl">{brl(aReceber)}</p>
        </div>
        <div className="cartao">
          <p className="text-xs text-vinho-muted">Despesas pagas</p>
          <p className="mt-1 font-titulo text-2xl font-semibold text-red-700 sm:text-3xl">{brl(despesas)}</p>
          {aPagar > 0 && <p className="text-[11px] text-vinho-muted">+ {brl(aPagar)} a pagar</p>}
        </div>
        <div className="cartao">
          <p className="text-xs text-vinho-muted">Saldo do mês</p>
          <p className={`mt-1 font-titulo text-2xl font-semibold sm:text-3xl ${recebido - despesas < 0 ? "text-red-700" : ""}`}>{brl(recebido - despesas)}</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="cartao lg:col-span-1">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-titulo text-xl font-semibold">Caixa de hoje</h2>
              <p className="text-xs text-vinho-muted">{fmt(new Date(), "dd/MM/yyyy")}</p>
            </div>
            <PdfCaixa
              clinica={clinicaParaPdf(clinica)}
              data={fmt(new Date(), "dd/MM/yyyy")}
              geradoEm={fmt(new Date(), "dd/MM/yyyy 'às' HH:mm")}
              responsavel={usuario.nome}
              arquivo={`caixa-${hoje}.pdf`}
              porForma={porForma.map((x) => ({ forma: FORMAS[x.f], entra: x.entra, sai: x.sai }))}
              itens={[...caixa].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0)).map((l) => paraPdf(l, hoje))}
            />
          </div>
          {porForma.length === 0 ? (
            <p className="py-4 text-sm text-vinho-muted">Nenhum pagamento registrado hoje.</p>
          ) : (
            <ul className="divide-y divide-vinho-borda text-sm">
              {porForma.map((x) => (
                <li key={x.f} className="flex justify-between py-2">
                  <span>{FORMAS[x.f]}</span>
                  <span className="tabular-nums">
                    {x.entra > 0 && <span className="text-green-700">{brl(x.entra)}</span>}
                    {x.sai > 0 && <span className="ml-2 text-red-700">−{brl(x.sai)}</span>}
                  </span>
                </li>
              ))}
              <li className="flex justify-between py-2 font-semibold">
                <span>Saldo do dia</span>
                <span className="tabular-nums">{brl(saldoDia)}</span>
              </li>
            </ul>
          )}
        </section>

        <section className="cartao lg:col-span-2 no-print">
          <h2 className="mb-1 flex items-center gap-2 font-titulo text-xl font-semibold">
            <AlertCircle size={18} className={vencidosEntrada.length ? "text-red-600" : "text-vinho-medio"} /> Em atraso
          </h2>
          {vencidosEntrada.length + vencidosSaida.length === 0 ? (
            <p className="py-4 text-sm text-vinho-muted">Nada vencido. 👏</p>
          ) : (
            <>
              <p className="text-xs text-vinho-muted">
                {vencidosEntrada.length > 0 && `${brl(soma(vencidosEntrada))} a receber de clientes`}
                {vencidosEntrada.length > 0 && vencidosSaida.length > 0 && " · "}
                {vencidosSaida.length > 0 && `${brl(soma(vencidosSaida))} em contas a pagar`}
              </p>
              <ul className="-mx-5 mt-2 divide-y divide-vinho-borda">
                {(vencidos ?? []).slice(0, 8).map((l) => (
                  <LinhaLancamento key={l.id} l={l} hoje={hoje} />
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <section className="cartao-lista no-print">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-vinho-borda px-5 py-3">
          <h2 className="font-titulo text-xl font-semibold">Lançamentos do mês</h2>
          <div className="flex flex-wrap items-center gap-2">
          <PdfMovimentos
            clinica={clinicaParaPdf(clinica)}
            periodo={tituloMes}
            filtro={filtros.find(([v]) => v === filtro)?.[1] ?? "Todos"}
            geradoEm={fmt(new Date(), "dd/MM/yyyy 'às' HH:mm")}
            usuario={usuario.nome}
            arquivo={`movimentacoes-${mes}${filtro === "todos" ? "" : `-${filtro}`}.pdf`}
            movimentos={[...lista].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0)).map((l) => paraPdf(l, hoje))}
          />
          <nav className="flex flex-wrap gap-1">
            {filtros.map(([v, r]) => (
              <Link
                key={v}
                href={`/financeiro?mes=${mes}${v === "todos" ? "" : `&filtro=${v}`}`}
                className={`rounded-full px-3 py-1 text-xs ${filtro === v ? "bg-vinho-acao text-white" : "text-vinho-muted hover:bg-vinho-fundo"}`}
              >
                {r}
              </Link>
            ))}
          </nav>
          </div>
        </div>
        {lista.length === 0 ? (
          <p className="p-8 text-center text-sm text-vinho-muted">Nenhum lançamento neste mês.</p>
        ) : (
          <ul className="divide-y divide-vinho-borda">
            {lista.map((l) => (
              <LinhaLancamento key={l.id} l={l} hoje={hoje} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
