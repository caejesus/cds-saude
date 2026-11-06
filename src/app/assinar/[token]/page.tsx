import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { buscarTermoPublico } from "@/lib/supabase/publico";
import { marcaPublica } from "@/lib/supabase/marca";
import { fmt } from "@/lib/tempo";
import { Assinar } from "./Assinar";

export const metadata: Metadata = { title: "Assinatura de termo", robots: { index: false, follow: false } };

export default async function AssinarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [termo, { logo_url }] = await Promise.all([buscarTermoPublico(token), marcaPublica()]);
  const expirado = !!termo && !termo.aceito_em && !!termo.expira_em && new Date(termo.expira_em) < new Date();

  if (!termo || expirado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-vinho-fundo px-4">
        <div className="max-w-sm space-y-3 rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="flex justify-center"><Logo logoUrl={logo_url} /></div>
          <p className="font-titulo text-2xl font-semibold">{expirado ? "Link expirado" : "Link inválido"}</p>
          <p className="text-sm text-vinho-muted">Peça um novo link de assinatura para a clínica.</p>
        </div>
      </main>
    );
  }

  const d = termo.cpf?.replace(/\D/g, "") ?? "";
  const cpf = d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : termo.cpf;
  const assinadoEm = termo.aceito_em ? fmt(termo.aceito_em, "dd/MM/yyyy 'às' HH:mm") : null;

  return (
    <main className="min-h-screen bg-vinho-fundo px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="flex flex-col items-center gap-1 text-center">
          <Logo logoUrl={logo_url} />
          <p className="text-xs text-vinho-muted">{[termo.clinica.nome, termo.clinica.cidade].filter(Boolean).join(" · ")}</p>
        </header>
        <article className="rounded-2xl border border-vinho-borda bg-white p-5 shadow-sm sm:p-8">
          <h1 className="mb-4 text-center font-titulo text-2xl font-semibold">
            Termo de Consentimento{termo.procedimento ? ` · ${termo.procedimento}` : ""}
          </h1>
          <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{termo.texto}</div>
          {termo.assinatura && (
            <div className="mt-6 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={termo.assinatura} alt="Sua assinatura" className="mx-auto h-24 object-contain" />
              <div className="mx-auto w-64 border-t border-vinho-escuro pt-1 text-sm">{termo.cliente}</div>
            </div>
          )}
        </article>
        <Assinar token={token} termo={termo} assinadoEm={assinadoEm} cpf={cpf} logoUrl={logo_url} />
        <p className="pb-6 text-center text-[11px] text-vinho-muted">
          Ao assinar, registramos data, hora, endereço IP e aparelho usado, como comprovação da assinatura eletrônica.
        </p>
      </div>
    </main>
  );
}
