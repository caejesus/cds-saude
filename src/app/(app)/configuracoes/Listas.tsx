"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { brl } from "@/lib/formato";
import type { Procedimento, Profissional } from "@/types/database";
import { FormProcedimento, FormProfissional } from "./Formularios";
import { ItemEditavel } from "./ItemEditavel";

function NovoItem({ rotulo, children }: { rotulo: string; children: (fechar: () => void) => React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  if (!aberto)
    return (
      <button type="button" onClick={() => setAberto(true)} className="botao-sec mt-2">
        <Plus size={16} /> {rotulo}
      </button>
    );
  return <div className="mt-3 rounded-lg border border-vinho-borda p-4">{children(() => setAberto(false))}</div>;
}

export function ListaProfissionais({ itens }: { itens: Profissional[] }) {
  return (
    <>
      {itens.length === 0 ? (
        <p className="text-sm text-vinho-muted">Nenhum profissional ainda. Cadastre pelo menos um para usar a agenda.</p>
      ) : (
        <ul className="divide-y divide-vinho-borda">
          {itens.map((p) => (
            <ItemEditavel
              key={p.id}
              tabela="profissionais"
              id={p.id}
              ativo={p.ativo}
              resumo={
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: p.cor_agenda }} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.nome}</p>
                    <p className="truncate text-xs text-vinho-muted">{[p.especialidade, p.registro].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                </div>
              }
              formulario={(fechar) => <FormProfissional p={p} aoSalvar={fechar} />}
            />
          ))}
        </ul>
      )}
      <NovoItem rotulo="Novo profissional">{(fechar) => <FormProfissional aoSalvar={fechar} />}</NovoItem>
    </>
  );
}

export function ListaProcedimentos({ itens }: { itens: Procedimento[] }) {
  return (
    <>
      {itens.length === 0 ? (
        <p className="text-sm text-vinho-muted">Nenhum procedimento ainda. A duração de cada um define o tempo na agenda.</p>
      ) : (
        <ul className="divide-y divide-vinho-borda">
          {itens.map((p) => (
            <ItemEditavel
              key={p.id}
              tabela="procedimentos"
              id={p.id}
              ativo={p.ativo}
              resumo={
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.nome}</p>
                  <p className="truncate text-xs text-vinho-muted">
                    {[p.categoria, `${p.duracao_minutos} min`, brl(Number(p.valor))].filter(Boolean).join(" · ")}
                  </p>
                </div>
              }
              formulario={(fechar) => <FormProcedimento p={p} aoSalvar={fechar} />}
            />
          ))}
        </ul>
      )}
      <NovoItem rotulo="Novo procedimento">{(fechar) => <FormProcedimento aoSalvar={fechar} />}</NovoItem>
    </>
  );
}
