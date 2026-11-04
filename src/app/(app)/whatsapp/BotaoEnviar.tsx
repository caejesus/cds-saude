"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, MessageCircle } from "lucide-react";
import { linkWhatsApp } from "@/lib/mensagens";
import type { TipoMensagem } from "@/lib/mensagens";
import { registrarEnvio } from "./actions";

/** Abre o WhatsApp com a mensagem pronta e registra o envio. */
export function BotaoWhatsApp({ tipo, clienteId, referenciaId, numero, mensagem, enviadoEm, rotulo = "Enviar" }: {
  tipo: TipoMensagem;
  clienteId: string | null;
  referenciaId: string | null;
  numero: string | null;
  mensagem: string;
  enviadoEm?: string | null;
  rotulo?: string;
}) {
  const router = useRouter();
  const [enviado, setEnviado] = useState(!!enviadoEm);
  if (!numero) return <span className="text-xs text-vinho-muted">Sem WhatsApp</span>;
  return (
    <a
      href={linkWhatsApp(numero, mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        setEnviado(true);
        registrarEnvio({ tipo, clienteId, referenciaId, numero, mensagem }).then(() => router.refresh());
      }}
      className={
        enviado
          ? "inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs text-green-800 hover:bg-green-100"
          : "inline-flex items-center gap-1 rounded-md bg-[#25D366] px-2.5 py-1.5 text-xs font-medium text-white hover:brightness-95"
      }
      title={enviadoEm ? `Enviado ${enviadoEm}` : undefined}
    >
      {enviado ? <CheckCheck size={14} /> : <MessageCircle size={14} />}
      {enviado ? (enviadoEm ? `Enviado ${enviadoEm}` : "Enviado · reenviar") : rotulo}
    </a>
  );
}
