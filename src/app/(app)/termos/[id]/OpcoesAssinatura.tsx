"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, MessageCircle, RefreshCw, Tablet } from "lucide-react";
import { AssinaturaInline } from "@/components/AreaAssinatura";
import { assinarPresencial, renovarLink, termoFoiAssinado } from "../actions";

export function OpcoesAssinatura({ termoId, link, expiraEm, expirado, cliente, whatsapp, clinica }: {
  termoId: string;
  link: string;
  expiraEm: string;
  expirado: boolean;
  cliente: string;
  whatsapp: string | null;
  clinica: string;
}) {
  const router = useRouter();
  const [modo, setModo] = useState<"link" | "aqui">("link");
  const [concordo, setConcordo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [renovando, iniciar] = useTransition();

  // Enquanto espera o cliente assinar pelo link, confere a cada 5 segundos.
  useEffect(() => {
    if (modo !== "link" || expirado) return;
    const t = setInterval(async () => {
      if (await termoFoiAssinado(termoId)) router.refresh();
    }, 5000);
    return () => clearInterval(t);
  }, [modo, expirado, termoId, router]);

  const mensagem = `Olá, ${cliente.split(" ")[0]}! Segue o termo de consentimento da ${clinica} para você ler e assinar pelo celular: ${link}`;
  const wpp = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, "").replace(/^(?!55)/, "55")}?text=${encodeURIComponent(mensagem)}`
    : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

  return (
    <div className="space-y-4 no-print">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setModo("link")}
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${modo === "link" ? "border-vinho-acao bg-vinho-fundo text-vinho-acao" : "border-vinho-borda text-vinho-muted"}`}>
          <Link2 size={16} /> Enviar link
        </button>
        <button type="button" onClick={() => setModo("aqui")}
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${modo === "aqui" ? "border-vinho-acao bg-vinho-fundo text-vinho-acao" : "border-vinho-borda text-vinho-muted"}`}>
          <Tablet size={16} /> Assinar neste aparelho
        </button>
      </div>

      {modo === "link" ? (
        expirado ? (
          <div className="space-y-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            <p>O link expirou. Gere um novo para enviar ao cliente.</p>
            <button type="button" disabled={renovando} onClick={() => iniciar(() => renovarLink(termoId))} className="botao">
              <RefreshCw size={16} /> Gerar novo link
            </button>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl bg-vinho-fundo p-4">
            <div className="flex gap-2">
              <input readOnly value={link} className="campo min-w-0 flex-1 bg-white text-xs" onFocus={(e) => e.target.select()} aria-label="Link de assinatura" />
              <button type="button" className="botao-sec shrink-0" onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              }}>
                {copiado ? <Check size={16} /> : <Copy size={16} />} {copiado ? "Copiado" : "Copiar"}
              </button>
            </div>
            <a href={wpp} target="_blank" rel="noopener noreferrer" className="botao w-full">
              <MessageCircle size={16} /> Enviar pelo WhatsApp{whatsapp ? "" : " (escolher contato)"}
            </a>
            <p className="flex items-center gap-2 text-xs text-vinho-muted">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vinho-medio opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-vinho-acao" /></span>
              Aguardando assinatura. Esta tela atualiza sozinha. Link válido até {expiraEm}.
            </p>
            <button type="button" disabled={renovando} onClick={() => iniciar(() => renovarLink(termoId))} className="text-xs text-vinho-muted underline-offset-2 hover:text-vinho-acao hover:underline">
              Gerar outro link (o atual deixa de funcionar)
            </button>
          </div>
        )
      ) : (
        <div className="space-y-3">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={concordo} onChange={(e) => setConcordo(e.target.checked)} className="mt-0.5 h-4 w-4 accent-vinho-acao" />
            Li e concordo com o termo acima.
          </label>
          {concordo && (
            <AssinaturaInline
              onEnviar={async (png) => {
                const e = await assinarPresencial(termoId, png);
                if (e) return e;
                router.refresh();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
