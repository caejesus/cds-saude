"use client";
import { useSyncExternalStore } from "react";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Um "relógio" compartilhado: avisa os componentes a cada segundo.
const assinar = (avisar: () => void) => {
  const t = setInterval(avisar, 1000);
  return () => clearInterval(t);
};
const segundoAtual = () => Math.floor(Date.now() / 1000);
const noServidor = () => 0; // no servidor não mostra hora (evita divergência na hidratação)

const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Relógio em tempo real no fuso da clínica. */
export function Relogio({ fuso }: { fuso: string }) {
  const segundo = useSyncExternalStore(assinar, segundoAtual, noServidor);
  if (!segundo) return <div className="h-[52px] w-40" aria-hidden />;
  const local = new TZDate(segundo * 1000, fuso);
  return (
    <div className="sm:text-right">
      <p className="font-titulo text-4xl font-semibold leading-none">
        {format(local, "HH:mm")}
        <span className="ml-1 text-xl text-vinho-muted">{format(local, "ss")}</span>
      </p>
      <p className="mt-1 text-xs text-vinho-muted">{maiuscula(format(local, "EEEE, d 'de' MMMM", { locale: ptBR }))}</p>
    </div>
  );
}
