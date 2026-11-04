import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { FormCliente } from "../FormCliente";

export default async function NovoClientePage({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar } = await searchParams;
  return (
    <div className="max-w-3xl space-y-6">
      <Link href={voltar === "agenda" ? "/agenda/novo" : "/clientes"} className="inline-flex items-center gap-1 text-sm text-vinho-muted hover:text-vinho-acao">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <Cabecalho titulo="Novo cliente" />
      <section className="cartao">
        <FormCliente voltar={voltar} />
      </section>
    </div>
  );
}
