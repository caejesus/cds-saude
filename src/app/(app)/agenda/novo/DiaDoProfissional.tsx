"use client";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { horariosLivres, paraHora, trechosDoDia, type Ocupado } from "@/lib/expediente";
import { ocupacaoDoDia } from "../actions";

/** Mostra o dia do profissional (ocupado/livre) e os horários onde cabe o procedimento. */
export function DiaDoProfissional({ profissionalId, profissionalNome, data, duracao, hora, ignorarId, hoje, agoraMin, onEscolher }: {
  profissionalId: string;
  profissionalNome: string;
  data: string;
  duracao: number;
  hora: string;
  ignorarId?: string;
  hoje: string;
  agoraMin: number;
  onEscolher: (hora: string) => void;
}) {
  const [ocupados, setOcupados] = useState<Ocupado[] | null>(null);
  const [chave, setChave] = useState("");
  const atual = `${profissionalId}|${data}`;

  useEffect(() => {
    if (!profissionalId || !data) return;
    let vivo = true;
    ocupacaoDoDia(profissionalId, data, ignorarId).then((r) => {
      if (vivo) {
        setOcupados(r);
        setChave(`${profissionalId}|${data}`);
      }
    });
    return () => {
      vivo = false;
    };
  }, [profissionalId, data, ignorarId]);

  const passado = data < hoje;
  const limiteAgora = data === hoje ? agoraMin : null;
  const carregando = chave !== atual;
  const lista = useMemo(() => (ocupados && !carregando ? ocupados : []), [ocupados, carregando]);
  const trechos = useMemo(() => trechosDoDia(lista, limiteAgora), [lista, limiteAgora]);
  const livres = useMemo(() => (duracao > 0 ? horariosLivres(lista, duracao, limiteAgora) : []), [lista, duracao, limiteAgora]);

  if (!profissionalId) return null;

  return (
    <div className="space-y-3 rounded-xl border border-vinho-borda bg-vinho-fundo/60 p-4 sm:col-span-2">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <CalendarClock size={16} className="text-vinho-acao" /> Dia de {profissionalNome}
        </p>
        <span className="text-xs text-vinho-muted">expediente 08:00 às 18:00 · {duracao} min</span>
      </div>

      {carregando ? (
        <p className="flex items-center gap-2 text-sm text-vinho-muted"><Loader2 size={14} className="animate-spin" /> Carregando agenda...</p>
      ) : passado ? (
        <p className="text-sm text-amber-800">Data no passado. Use só para registrar atendimentos já feitos.</p>
      ) : (
        <>
          <ol className="space-y-1">
            {trechos.map((t, i) =>
              t.tipo === "ocupado" ? (
                <li key={i} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-vinho-borda">
                  <span className="w-[92px] shrink-0 font-titulo font-semibold tabular-nums">{t.item.inicio}–{t.item.fim}</span>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-vinho-acao" />
                  <span className="min-w-0 truncate">{t.item.cliente}{t.item.procedimento ? ` · ${t.item.procedimento}` : ""}</span>
                  <span className="ml-auto shrink-0 text-xs text-vinho-muted">{t.fim - t.ini} min</span>
                </li>
              ) : (
                <li key={i} className="flex items-center gap-3 px-3 py-1 text-xs text-vinho-muted">
                  <span className="w-[92px] shrink-0 tabular-nums">{paraHora(t.ini)}–{paraHora(t.fim)}</span>
                  <span className="h-2 w-2 shrink-0 rounded-full border border-vinho-medio" />
                  <span>livre · {t.fim - t.ini} min{t.fim - t.ini < duracao ? " (não cabe este procedimento)" : ""}</span>
                </li>
              )
            )}
          </ol>

          <div>
            <p className="mb-1.5 text-xs font-medium text-vinho-escuro/80">
              {livres.length ? `Horários que cabem ${duracao} min:` : "Nenhum horário livre que caiba este procedimento neste dia."}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {livres.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onEscolher(h)}
                  className={`rounded-md px-2.5 py-1 text-xs tabular-nums transition ${h === hora ? "bg-vinho-acao text-white" : "bg-white text-vinho-escuro ring-1 ring-vinho-borda hover:ring-vinho-medio"}`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
