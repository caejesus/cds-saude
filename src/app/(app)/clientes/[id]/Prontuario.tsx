"use client";
import { useActionState, useRef } from "react";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Mensagem } from "@/components/ui/Mensagem";
import type { Profissional } from "@/types/database";
import { adicionarEvolucao } from "../actions";

export function NovaEvolucao({ clienteId, profissionais }: { clienteId: string; profissionais: Profissional[] }) {
  const ref = useRef<HTMLFormElement>(null);
  const [estado, acao] = useActionState(async (s: Parameters<typeof adicionarEvolucao>[0], f: FormData) => {
    const r = await adicionarEvolucao(s, f);
    if (r?.ok) ref.current?.reset();
    return r;
  }, undefined);
  return (
    <form ref={ref} action={acao} className="space-y-3">
      <input type="hidden" name="cliente_id" value={clienteId} />
      <textarea name="texto" required className="campo min-h-[100px]" placeholder="Procedimento realizado, produtos usados, reação, orientações..." />
      <div className="flex flex-wrap items-center gap-3">
        {profissionais.length > 0 && (
          <select name="profissional_id" className="campo w-auto" defaultValue="">
            <option value="">Profissional (opcional)</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        )}
        <BotaoEnviar>Registrar</BotaoEnviar>
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}
