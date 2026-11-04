import Link from "next/link";
import { AlertTriangle, Banknote, CheckCircle2, MessageCircle, MoreHorizontal, Package } from "lucide-react";
import { StatusBadge, STATUS } from "@/components/StatusBadge";
import { linkWhatsapp } from "@/lib/formato";
import { fmt } from "@/lib/tempo";
import type { StatusAgendamento } from "@/types/database";
import { mudarStatus } from "./actions";
import { estornarSessao, usarSessao } from "../pacotes/actions";

export type ItemAgenda = {
  id: string;
  inicio: string;
  fim: string;
  status: StatusAgendamento;
  observacoes: string | null;
  profissional_id: string | null;
  procedimento_id: string | null;
  pacote_cliente_id: string | null;
  clientes: { id: string; nome: string; alergias: string | null; whatsapp: string | null; telefone: string | null } | null;
  procedimentos: { nome: string } | null;
};

export type PacoteAtivo = {
  id: string;
  cliente_id: string;
  sessoes_total: number;
  sessoes_usadas: number;
  valido_ate: string | null;
  pacotes: { nome: string; procedimento_id: string | null } | null;
};

const PROXIMOS: Record<StatusAgendamento, StatusAgendamento[]> = {
  agendado: ["confirmado", "em_atendimento", "faltou", "cancelado"],
  confirmado: ["em_atendimento", "concluido", "faltou", "cancelado"],
  em_atendimento: ["concluido", "cancelado"],
  concluido: ["em_atendimento"],
  faltou: ["agendado"],
  cancelado: ["agendado"],
};

export function CartaoAgendamento({ a, cor, nomeClinica, financeiro, data, pacote }: {
  a: ItemAgenda;
  cor: string;
  nomeClinica: string;
  financeiro?: "pago" | "pendente";
  data: string;
  pacote?: PacoteAtivo;
}) {
  const atendido = a.status === "concluido" || a.status === "em_atendimento";
  const podeUsarPacote = atendido && !a.pacote_cliente_id && !financeiro && !!pacote;
  const podeReceber = atendido && !financeiro && !a.pacote_cliente_id;
  const inativo = a.status === "cancelado" || a.status === "faltou";
  const c = a.clientes;
  const confirmar = linkWhatsapp(
    c?.whatsapp || c?.telefone || null,
    `Olá, ${c?.nome.split(" ")[0] ?? ""}! Passando para confirmar seu horário na ${nomeClinica}: ${fmt(a.inicio, "EEEE, dd/MM 'às' HH:mm")}${a.procedimentos ? ` (${a.procedimentos.nome})` : ""}. Podemos confirmar?`
  );

  return (
    <article
      className={`rounded-lg border border-vinho-borda bg-white p-3 shadow-sm ${inativo ? "opacity-55" : ""}`}
      style={{ borderLeft: `4px solid ${cor}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-titulo text-lg font-semibold leading-none">
          {fmt(a.inicio, "HH:mm")}
          <span className="font-corpo text-xs font-normal text-vinho-muted"> – {fmt(a.fim, "HH:mm")}</span>
        </p>
        <StatusBadge status={a.status} />
      </div>
      {c ? (
        <Link href={`/clientes/${c.id}`} className="mt-2 flex items-center gap-1.5 text-sm font-medium hover:text-vinho-acao">
          <span className="truncate">{c.nome}</span>
          {c.alergias && <AlertTriangle size={14} className="shrink-0 text-amber-600" aria-label={`Alergias: ${c.alergias}`} />}
        </Link>
      ) : (
        <p className="mt-2 text-sm text-vinho-muted">Cliente removido</p>
      )}
      <p className="truncate text-xs text-vinho-muted">{a.procedimentos?.nome ?? "Sem procedimento"}</p>
      {a.observacoes && <p className="mt-1 line-clamp-2 text-xs italic text-vinho-muted">{a.observacoes}</p>}

      <div className="mt-2 flex items-center gap-1">
        {confirmar && a.status === "agendado" && (
          <a href={confirmar} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-green-700 hover:bg-green-50">
            <MessageCircle size={14} /> Confirmar
          </a>
        )}
        {podeUsarPacote && pacote && (
          <form action={usarSessao}>
            <input type="hidden" name="agendamento_id" value={a.id} />
            <input type="hidden" name="pacote_cliente_id" value={pacote.id} />
            <button
              className="inline-flex items-center gap-1 rounded-md bg-vinho-acao px-2 py-1 text-xs font-medium text-white hover:bg-vinho-escuro"
              title={pacote.pacotes?.nome ?? "Pacote"}
            >
              <Package size={14} /> Usar sessão {pacote.sessoes_usadas + 1}/{pacote.sessoes_total}
            </button>
          </form>
        )}
        {a.pacote_cliente_id && (
          <span className="inline-flex items-center gap-1 px-1 text-xs text-vinho-acao"><Package size={14} /> Sessão do pacote</span>
        )}
        {podeReceber && (
          <Link
            href={`/financeiro/novo?agendamento=${a.id}&voltar=${encodeURIComponent(`/agenda?data=${data}`)}`}
            className={
              podeUsarPacote
                ? "inline-flex items-center gap-1 rounded-md border border-vinho-borda px-2 py-1 text-xs text-vinho-muted hover:border-vinho-medio"
                : "inline-flex items-center gap-1 rounded-md bg-vinho-acao px-2 py-1 text-xs font-medium text-white hover:bg-vinho-escuro"
            }
          >
            <Banknote size={14} /> Receber
          </Link>
        )}
        {financeiro === "pago" && (
          <span className="inline-flex items-center gap-1 px-1 text-xs text-green-700"><CheckCircle2 size={14} /> Pago</span>
        )}
        {financeiro === "pendente" && <span className="px-1 text-xs text-amber-700">A receber</span>}
        <details className="relative ml-auto">
          <summary className="flex cursor-pointer list-none items-center rounded-md p-1 text-vinho-muted hover:bg-vinho-fundo hover:text-vinho-acao" aria-label="Ações">
            <MoreHorizontal size={16} />
          </summary>
          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-vinho-borda bg-white py-1 shadow-lg">
            {PROXIMOS[a.status].map((s) => (
              <form key={s} action={mudarStatus}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="status" value={s} />
                <button className="block w-full px-3 py-1.5 text-left text-sm hover:bg-vinho-fundo">
                  {s === "agendado" ? "Reabrir" : `Marcar: ${STATUS[s].rotulo}`}
                </button>
              </form>
            ))}
            {a.pacote_cliente_id && (
              <form action={estornarSessao}>
                <input type="hidden" name="agendamento_id" value={a.id} />
                <button className="block w-full border-t border-vinho-borda px-3 py-1.5 text-left text-sm hover:bg-vinho-fundo">Desfazer baixa da sessão</button>
              </form>
            )}
            <Link href={`/agenda/novo?editar=${a.id}`} className="block border-t border-vinho-borda px-3 py-1.5 text-sm hover:bg-vinho-fundo">
              Remarcar / editar
            </Link>
          </div>
        </details>
      </div>
    </article>
  );
}
