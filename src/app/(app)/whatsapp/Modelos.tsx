"use client";
import { useActionState } from "react";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Mensagem } from "@/components/ui/Mensagem";
import { MODELOS, type TipoMensagem } from "@/lib/mensagens";
import { restaurarModelo, salvarModelo } from "./actions";

function FormModelo({ tipo, texto, personalizado }: { tipo: TipoMensagem; texto: string; personalizado: boolean }) {
  const [estado, acao] = useActionState(salvarModelo, undefined);
  const m = MODELOS[tipo];
  return (
    <div className="cartao space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-titulo text-lg font-semibold">{m.titulo}</h3>
        {personalizado && <span className="text-[11px] text-vinho-muted">Personalizado</span>}
      </div>
      <form action={acao} className="space-y-3">
        <input type="hidden" name="tipo" value={tipo} />
        <textarea name="mensagem" defaultValue={texto} className="campo min-h-[150px] text-sm" />
        <p className="text-xs text-vinho-muted">
          Campos: {m.campos.map((c) => <code key={c} className="mr-1 rounded bg-vinho-fundo px-1">{`{${c}}`}</code>)}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <BotaoEnviar>Salvar</BotaoEnviar>
          <Mensagem estado={estado} />
        </div>
      </form>
      {personalizado && (
        <form action={restaurarModelo}>
          <input type="hidden" name="tipo" value={tipo} />
          <button className="text-xs text-vinho-muted hover:text-vinho-acao hover:underline">Voltar ao texto padrão</button>
        </form>
      )}
    </div>
  );
}

export function Modelos({ textos, personalizados }: { textos: Record<TipoMensagem, string>; personalizados: TipoMensagem[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(Object.keys(MODELOS) as TipoMensagem[]).map((t) => (
        <FormModelo key={`${t}-${textos[t].length}`} tipo={t} texto={textos[t]} personalizado={personalizados.includes(t)} />
      ))}
    </div>
  );
}
