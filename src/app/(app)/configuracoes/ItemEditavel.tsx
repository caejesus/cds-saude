"use client";
import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { alternarAtivo } from "./actions";

export function ItemEditavel({ tabela, id, ativo, resumo, formulario }: {
  tabela: "profissionais" | "procedimentos";
  id: string;
  ativo: boolean;
  resumo: React.ReactNode;
  formulario: (fechar: () => void) => React.ReactNode;
}) {
  const [editando, setEditando] = useState(false);
  return (
    <li className={`py-3 ${ativo ? "" : "opacity-55"}`}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">{resumo}</div>
        <form action={alternarAtivo}>
          <input type="hidden" name="tabela" value={tabela} />
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="ativo" value={String(!ativo)} />
          <button className="rounded-full border border-vinho-borda px-2.5 py-1 text-[11px] text-vinho-muted hover:border-vinho-medio">
            {ativo ? "Desativar" : "Reativar"}
          </button>
        </form>
        <button
          type="button"
          aria-label={editando ? "Fechar edição" : "Editar"}
          onClick={() => setEditando(!editando)}
          className="rounded-lg p-1.5 text-vinho-muted hover:bg-vinho-fundo hover:text-vinho-acao"
        >
          {editando ? <X size={16} /> : <Pencil size={16} />}
        </button>
      </div>
      {editando && <div className="mt-3 rounded-lg bg-vinho-fundo p-4">{formulario(() => setEditando(false))}</div>}
    </li>
  );
}
