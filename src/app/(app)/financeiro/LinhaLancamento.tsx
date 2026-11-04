import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { brl, FORMAS } from "@/lib/formato";
import { fmtData } from "@/lib/tempo";
import { mudarSituacao, pagarLancamento } from "./actions";

export type LinhaFin = {
  id: string;
  numero: number | null;
  usuarios: { nome: string } | null;
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  categoria: string | null;
  forma_pagamento: string | null;
  vencimento: string | null;
  pago_em: string | null;
  status: "pendente" | "pago" | "cancelado";
  cliente_id: string | null;
  clientes: { nome: string } | null;
};

export function LinhaLancamento({ l, hoje }: { l: LinhaFin; hoje: string }) {
  const vencido = l.status === "pendente" && !!l.vencimento && l.vencimento < hoje;
  const data = l.status === "pago" ? l.pago_em : l.vencimento;
  const selo =
    l.status === "pago"
      ? { t: l.tipo === "entrada" ? "Recebido" : "Pago", c: "bg-green-50 text-green-800" }
      : l.status === "cancelado"
        ? { t: "Cancelado", c: "bg-gray-100 text-gray-500 line-through" }
        : vencido
          ? { t: "Vencido", c: "bg-red-50 text-red-800" }
          : { t: l.tipo === "entrada" ? "A receber" : "A pagar", c: "bg-amber-50 text-amber-800" };

  return (
    <li className={`flex items-center gap-3 px-5 py-3 ${l.status === "cancelado" ? "opacity-50" : ""}`}>
      <div className="w-12 shrink-0 text-center">
        <p className="font-titulo text-lg font-semibold leading-none">{data ? fmtData(data, "dd") : "—"}</p>
        <p className="text-[10px] uppercase text-vinho-muted">{data ? fmtData(data, "MMM") : ""}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          <span className="mr-1.5 font-mono text-[11px] text-vinho-muted">{l.numero ? String(l.numero).padStart(3, "0") : ""}</span>
          {l.descricao}
        </p>
        <p className="truncate text-xs text-vinho-muted">
          {[
            l.clientes && l.cliente_id ? <Link key="c" href={`/clientes/${l.cliente_id}`} className="hover:text-vinho-acao hover:underline">{l.clientes.nome}</Link> : null,
            l.categoria,
            l.status === "pago" && l.forma_pagamento ? FORMAS[l.forma_pagamento] : null,
          ]
            .filter(Boolean)
            .flatMap((x, i) => (i ? [" · ", x] : [x]))}
        </p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold tabular-nums ${l.tipo === "entrada" ? "text-green-700" : "text-red-700"}`}>
          {l.tipo === "saida" ? "−" : ""}
          {brl(Number(l.valor))}
        </p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${selo.c}`}>{selo.t}</span>
      </div>
      <details className="relative">
        <summary className="flex cursor-pointer list-none rounded-md p-1 text-vinho-muted hover:bg-vinho-fundo hover:text-vinho-acao" aria-label="Ações">
          <MoreHorizontal size={16} />
        </summary>
        <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-vinho-borda bg-white p-2 shadow-lg">
          {l.status === "pendente" && (
            <form action={pagarLancamento} className="space-y-2 border-b border-vinho-borda pb-2">
              <input type="hidden" name="id" value={l.id} />
              <select name="forma_pagamento" defaultValue={l.forma_pagamento ?? "pix"} className="campo py-1.5 text-sm">
                {Object.entries(FORMAS).map(([v, r]) => (
                  <option key={v} value={v}>{r}</option>
                ))}
              </select>
              <button className="botao w-full py-1.5">{l.tipo === "entrada" ? "Receber hoje" : "Pagar hoje"}</button>
            </form>
          )}
          <form action={mudarSituacao}>
            <input type="hidden" name="id" value={l.id} />
            {l.status === "cancelado" || l.status === "pago" ? (
              <button name="acao" value="reabrir" className="mt-1 block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-vinho-fundo">
                {l.status === "pago" ? "Desfazer pagamento" : "Reabrir"}
              </button>
            ) : (
              <button name="acao" value="cancelar" className="mt-1 block w-full rounded px-2 py-1.5 text-left text-sm text-red-700 hover:bg-red-50">
                Cancelar lançamento
              </button>
            )}
          </form>
        </div>
      </details>
    </li>
  );
}
