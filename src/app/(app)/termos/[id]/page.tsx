import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { getContexto } from "@/lib/contexto";
import { fmt } from "@/lib/tempo";
import { Logo } from "@/components/Logo";
import type { TermoConsentimento } from "@/types/database";
import { clinicaParaPdf } from "@/lib/pdf/clinica";
import { PdfTermo } from "./PdfTermo";
import { OpcoesAssinatura } from "./OpcoesAssinatura";

type Termo = TermoConsentimento & { clientes: { id: string; nome: string; cpf: string | null; whatsapp: string | null; telefone: string | null } | null; procedimentos: { nome: string } | null };

export default async function TermoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, clinica } = await getContexto();
  const { data: termo } = await supabase
    .from("termos_consentimento")
    .select("*, clientes(id, nome, cpf, whatsapp, telefone), procedimentos(nome)")
    .eq("id", id)
    .maybeSingle<Termo>();
  if (!termo) notFound();

  const d = termo.clientes?.cpf?.replace(/\D/g, "") ?? "";
  const cpf = d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : termo.clientes?.cpf ?? null;
  let assinatura: string | null = termo.assinatura_png;
  if (!assinatura && termo.assinatura_url) {
    const { data } = await supabase.storage.from("fotos").createSignedUrl(termo.assinatura_url, 3600);
    assinatura = data?.signedUrl ?? null;
  }

  const aparelho = descreverAparelho(termo.assinado_user_agent);
  const registro = termo.aceito_em
    ? [termo.assinado_via === "link" ? "Assinado pelo link enviado ao cliente" : termo.assinado_via === "presencial" ? "Assinado presencialmente" : null,
       aparelho, termo.assinado_ip ? `IP ${termo.assinado_ip}` : null].filter(Boolean).join(" · ")
    : null;
  const expirado = !termo.aceito_em && new Date(termo.token_expira_em) < new Date();
  const h = await headers();
  const origem = process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between no-print">
        <Link href={`/clientes/${termo.cliente_id}`} className="inline-flex items-center gap-1 text-sm text-vinho-muted hover:text-vinho-acao">
          <ArrowLeft size={16} /> {termo.clientes?.nome}
        </Link>
        <PdfTermo
          clinica={clinicaParaPdf(clinica)}
          titulo={`Termo de Consentimento${termo.procedimentos ? ` · ${termo.procedimentos.nome}` : ""}`}
          texto={termo.texto}
          cliente={termo.clientes?.nome ?? ""}
          cpf={cpf}
          assinaturaUrl={assinatura}
          assinadoEm={termo.aceito_em ? fmt(termo.aceito_em, "dd/MM/yyyy 'às' HH:mm") : null}
          registro={registro}
          codigo={termo.id.slice(0, 8).toUpperCase()}
        />
      </div>

      <article className="cartao space-y-6 sm:p-10">
        <header className="flex items-start justify-between gap-4 border-b border-vinho-borda pb-5">
          <div>
            <Logo logoUrl={clinica.logo_url} />
            <p className="mt-2 text-xs text-vinho-muted">
              {[clinica.nome, clinica.cnpj && `CNPJ ${clinica.cnpj}`, clinica.endereco, clinica.cidade].filter(Boolean).join(" · ")}
            </p>
          </div>
          {termo.aceito_em && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-800">
              <CheckCircle2 size={14} /> Assinado
            </span>
          )}
        </header>
        <h1 className="text-center font-titulo text-2xl font-semibold">
          Termo de Consentimento{termo.procedimentos ? ` · ${termo.procedimentos.nome}` : ""}
        </h1>
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{termo.texto}</div>

        {termo.aceito_em ? (
          <footer className="pt-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {assinatura && <img src={assinatura} alt="Assinatura" className="mx-auto h-28 object-contain" />}
            <div className="mx-auto w-72 border-t border-vinho-escuro pt-1 text-sm">{termo.clientes?.nome}</div>
            <p className="mt-2 text-xs text-vinho-muted">Assinado eletronicamente em {fmt(termo.aceito_em, "dd/MM/yyyy 'às' HH:mm")}</p>
            {registro && <p className="text-[11px] text-vinho-muted">{registro}</p>}
          </footer>
        ) : (
          <OpcoesAssinatura
            termoId={termo.id}
            link={`${origem}/assinar/${termo.token}`}
            expiraEm={fmt(termo.token_expira_em, "dd/MM 'às' HH:mm")}
            expirado={expirado}
            cliente={termo.clientes?.nome ?? ""}
            whatsapp={termo.clientes?.whatsapp || termo.clientes?.telefone || null}
            clinica={clinica.nome}
          />
        )}
      </article>
    </div>
  );
}

function descreverAparelho(ua: string | null) {
  if (!ua) return null;
  const so = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : null;
  const nav = /Edg\//.test(ua) ? "Edge" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : null;
  return [so, nav].filter(Boolean).join(", ") || null;
}
