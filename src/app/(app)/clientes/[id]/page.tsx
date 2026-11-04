import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, CalendarPlus, FileSignature, MessageCircle, ShoppingBag, Wallet } from "lucide-react";
import { getContexto } from "@/lib/contexto";
import { fmt, fmtData, hojeISO } from "@/lib/tempo";
import { brl, idade, linkWhatsapp, telefoneBR } from "@/lib/formato";
import { StatusBadge } from "@/components/StatusBadge";
import { BarraSessoes } from "@/components/BarraSessoes";
import { Galeria, type Foto } from "./Galeria";
import type { Cliente, FotoEvolucao, Profissional, StatusAgendamento } from "@/types/database";
import { FormCliente } from "../FormCliente";
import { NovaEvolucao } from "./Prontuario";
import { alternarCliente } from "../actions";

type PacoteDoCliente = {
  id: string;
  sessoes_total: number;
  sessoes_usadas: number;
  valido_ate: string | null;
  status: string;
  criado_em: string;
  pacotes: { nome: string } | null;
};

type Evolucao = { id: string; texto: string; criado_em: string; profissionais: { nome: string } | null };
type Atendimento = {
  id: string;
  inicio: string;
  status: StatusAgendamento;
  procedimentos: { nome: string; valor: number } | null;
  profissionais: { nome: string } | null;
};

export default async function FichaClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, clinica } = await getContexto();

  const [
    { data: cliente },
    { data: evolucoes },
    { data: atendimentos },
    { data: profissionais },
    { data: pendencias },
    { data: pagos },
    { data: pacotes },
    { data: fotosRaw },
    { data: termos },
  ] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", id).maybeSingle<Cliente>(),
    supabase
      .from("evolucoes")
      .select("id, texto, criado_em, profissionais(nome)")
      .eq("cliente_id", id)
      .order("criado_em", { ascending: false })
      .returns<Evolucao[]>(),
    supabase
      .from("agendamentos")
      .select("id, inicio, status, procedimentos(nome, valor), profissionais(nome)")
      .eq("cliente_id", id)
      .order("inicio", { ascending: false })
      .limit(50)
      .returns<Atendimento[]>(),
    supabase.from("profissionais").select("*").eq("ativo", true).order("nome").returns<Profissional[]>(),
    supabase
      .from("lancamentos")
      .select("id, descricao, valor, vencimento")
      .eq("cliente_id", id)
      .eq("tipo", "entrada")
      .eq("status", "pendente")
      .order("vencimento")
      .returns<{ id: string; descricao: string; valor: number; vencimento: string | null }[]>(),
    supabase
      .from("lancamentos")
      .select("valor")
      .eq("cliente_id", id)
      .eq("tipo", "entrada")
      .eq("status", "pago")
      .returns<{ valor: number }[]>(),
    supabase
      .from("pacotes_cliente")
      .select("id, sessoes_total, sessoes_usadas, valido_ate, status, criado_em, pacotes(nome)")
      .eq("cliente_id", id)
      .order("criado_em", { ascending: false })
      .returns<PacoteDoCliente[]>(),
    supabase.from("fotos_evolucao").select("*").eq("cliente_id", id).order("criado_em").returns<FotoEvolucao[]>(),
    supabase
      .from("termos_consentimento")
      .select("id, aceito_em, criado_em, procedimentos(nome)")
      .eq("cliente_id", id)
      .order("criado_em", { ascending: false })
      .returns<{ id: string; aceito_em: string | null; criado_em: string; procedimentos: { nome: string } | null }[]>(),
  ]);
  if (!cliente) notFound();

  const caminhos = (fotosRaw ?? []).map((f) => f.storage_path);
  const { data: assinadas } = caminhos.length
    ? await supabase.storage.from("fotos").createSignedUrls(caminhos, 3600)
    : { data: [] };
  const urls = new Map((assinadas ?? []).map((x) => [x.path, x.signedUrl]));
  const fotos: Foto[] = (fotosRaw ?? []).map((f) => ({
    id: f.id,
    url: urls.get(f.storage_path) ?? null,
    regiao: f.regiao,
    momento: f.momento,
    criado_em: f.criado_em,
    data: fmt(f.criado_em, "dd/MM/yy"),
  }));

  const wpp = linkWhatsapp(cliente.whatsapp || cliente.telefone, `Olá, ${cliente.nome.split(" ")[0]}!`);
  const anos = idade(cliente.data_nascimento);
  const concluidos = (atendimentos ?? []).filter((a) => a.status === "concluido");
  const faltas = (atendimentos ?? []).filter((a) => a.status === "faltou").length;
  const hoje = hojeISO();
  const totalPago = (pagos ?? []).reduce((t, l) => t + Number(l.valor), 0);
  const emAberto = (pendencias ?? []).reduce((t, l) => t + Number(l.valor), 0);

  return (
    <div className="space-y-6">
      <Link href="/clientes" className="inline-flex items-center gap-1 text-sm text-vinho-muted hover:text-vinho-acao">
        <ArrowLeft size={16} /> Clientes
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-titulo text-3xl font-semibold sm:text-4xl">{cliente.nome}</h1>
          <p className="mt-1 text-sm text-vinho-muted">
            {[telefoneBR(cliente.whatsapp || cliente.telefone), anos !== null && `${anos} anos`, !cliente.ativo && "Inativo"]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {wpp && (
            <a href={wpp} target="_blank" rel="noopener noreferrer" className="botao-sec">
              <MessageCircle size={16} /> WhatsApp
            </a>
          )}
          <Link href={`/agenda/novo?cliente=${cliente.id}`} className="botao">
            <CalendarPlus size={16} /> Agendar
          </Link>
        </div>
      </header>

      {cliente.alergias && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle size={20} className="shrink-0" />
          <div>
            <p className="text-sm font-medium">Alergias e contraindicações</p>
            <p className="text-sm">{cliente.alergias}</p>
          </div>
        </div>
      )}

      <section className="grid grid-cols-3 gap-3">
        <div className="cartao">
          <p className="font-titulo text-2xl font-semibold">{concluidos.length}</p>
          <p className="text-xs text-vinho-muted">Atendimentos</p>
        </div>
        <div className="cartao">
          <p className="font-titulo text-2xl font-semibold">{brl(totalPago)}</p>
          <p className="text-xs text-vinho-muted">Total pago</p>
        </div>
        <div className="cartao">
          <p className="font-titulo text-2xl font-semibold">{faltas}</p>
          <p className="text-xs text-vinho-muted">Faltas</p>
        </div>
      </section>

      {(pendencias ?? []).length > 0 && (
        <section className="cartao border-amber-200">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-titulo text-xl font-semibold">
              <Wallet size={18} className="text-amber-600" /> Em aberto: {brl(emAberto)}
            </h2>
            <Link href="/financeiro?filtro=pendentes" className="text-xs text-vinho-acao hover:underline">Ver no financeiro</Link>
          </div>
          <ul className="divide-y divide-vinho-borda text-sm">
            {(pendencias ?? []).map((l) => (
              <li key={l.id} className="flex justify-between gap-3 py-2">
                <span className="min-w-0 truncate">{l.descricao}</span>
                <span className={`shrink-0 tabular-nums ${l.vencimento && l.vencimento < hoje ? "text-red-700" : "text-vinho-muted"}`}>
                  {l.vencimento ? fmtData(l.vencimento, "dd/MM") : ""} · {brl(Number(l.valor))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="cartao lg:col-span-3">
          <h2 className="mb-4 font-titulo text-xl font-semibold">Prontuário</h2>
          <NovaEvolucao clienteId={cliente.id} profissionais={profissionais ?? []} />
          <ol className="mt-6 space-y-4 border-l-2 border-vinho-borda pl-4">
            {(evolucoes ?? []).length === 0 && <p className="text-sm text-vinho-muted">Nenhuma anotação ainda.</p>}
            {(evolucoes ?? []).map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-vinho-medio" />
                <p className="text-xs text-vinho-muted">
                  {fmt(e.criado_em, "dd/MM/yyyy 'às' HH:mm")}
                  {e.profissionais && ` · ${e.profissionais.nome}`}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{e.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="cartao lg:col-span-2">
          <h2 className="mb-4 font-titulo text-xl font-semibold">Atendimentos</h2>
          {(atendimentos ?? []).length === 0 ? (
            <p className="text-sm text-vinho-muted">Nenhum agendamento.</p>
          ) : (
            <ul className="divide-y divide-vinho-borda">
              {(atendimentos ?? []).map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <Link href={`/agenda?data=${fmt(a.inicio, "yyyy-MM-dd")}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.procedimentos?.nome ?? "Atendimento"}</p>
                    <p className="truncate text-xs text-vinho-muted">
                      {fmt(a.inicio, "dd/MM/yy HH:mm")}
                      {a.profissionais && ` · ${a.profissionais.nome}`}
                    </p>
                  </Link>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="cartao">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-titulo text-xl font-semibold">Pacotes</h2>
            <Link href={`/pacotes/vender?cliente=${cliente.id}`} className="botao-sec py-1.5 text-xs"><ShoppingBag size={14} /> Vender</Link>
          </div>
          {(pacotes ?? []).length === 0 ? (
            <p className="text-sm text-vinho-muted">Nenhum pacote.</p>
          ) : (
            <ul className="space-y-3">
              {(pacotes ?? []).map((p) => {
                const expirado = p.status === "ativo" && !!p.valido_ate && p.valido_ate < hoje;
                return (
                  <li key={p.id} className={p.status === "ativo" && !expirado ? "" : "opacity-60"}>
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">{p.pacotes?.nome ?? "Pacote"}</p>
                      <p className="shrink-0 text-xs text-vinho-muted">
                        {expirado ? "Vencido" : p.status === "concluido" ? "Concluído" : p.status === "cancelado" ? "Cancelado" : p.valido_ate ? `até ${fmtData(p.valido_ate, "dd/MM/yy")}` : ""}
                      </p>
                    </div>
                    <BarraSessoes usadas={p.sessoes_usadas} total={p.sessoes_total} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="cartao">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-titulo text-xl font-semibold">Termos de consentimento</h2>
            <Link href={`/termos/novo?cliente=${cliente.id}`} className="botao-sec py-1.5 text-xs"><FileSignature size={14} /> Novo termo</Link>
          </div>
          {(termos ?? []).length === 0 ? (
            <p className="text-sm text-vinho-muted">Nenhum termo. Gere antes do primeiro procedimento.</p>
          ) : (
            <ul className="divide-y divide-vinho-borda">
              {(termos ?? []).map((t) => (
                <li key={t.id}>
                  <Link href={`/termos/${t.id}`} className="flex items-center justify-between gap-3 py-2 hover:text-vinho-acao">
                    <span className="min-w-0 truncate text-sm">{t.procedimentos?.nome ?? "Termo"} · {fmt(t.criado_em, "dd/MM/yy")}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${t.aceito_em ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
                      {t.aceito_em ? "Assinado" : "Aguardando assinatura"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="cartao">
        <h2 className="mb-4 font-titulo text-xl font-semibold">Fotos de evolução</h2>
        <Galeria clinicaId={clinica.id} clienteId={cliente.id} fotos={fotos} />
      </section>

      <section className="cartao">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-titulo text-xl font-semibold">Dados cadastrais</h2>
          <form action={alternarCliente}>
            <input type="hidden" name="id" value={cliente.id} />
            <input type="hidden" name="ativo" value={String(!cliente.ativo)} />
            <button className="text-xs text-vinho-muted hover:text-vinho-acao hover:underline">
              {cliente.ativo ? "Marcar como inativo" : "Reativar cliente"}
            </button>
          </form>
        </div>
        <FormCliente cliente={cliente} />
      </section>
    </div>
  );
}
