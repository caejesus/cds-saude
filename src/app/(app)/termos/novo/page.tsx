import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getContexto } from "@/lib/contexto";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { fmt, agora } from "@/lib/tempo";
import type { Cliente } from "@/types/database";
import { FormTermo } from "./FormTermo";

export default async function NovoTermoPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const { cliente: id } = await searchParams;
  if (!id) notFound();
  const { supabase, clinica } = await getContexto();
  const [{ data: cliente }, { data: procedimentos }] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", id).maybeSingle<Cliente>(),
    supabase.from("procedimentos").select("id, nome").eq("ativo", true).order("nome").returns<{ id: string; nome: string }[]>(),
  ]);
  if (!cliente) notFound();
  return (
    <div className="max-w-3xl space-y-6">
      <Link href={`/clientes/${cliente.id}`} className="inline-flex items-center gap-1 text-sm text-vinho-muted hover:text-vinho-acao">
        <ArrowLeft size={16} /> {cliente.nome}
      </Link>
      <Cabecalho titulo="Termo de consentimento" />
      <section className="cartao">
        <FormTermo
          clienteId={cliente.id}
          procedimentos={procedimentos ?? []}
          dados={{ cliente: cliente.nome, cpf: cliente.cpf, clinica: clinica.nome, cidade: clinica.cidade, data: fmt(agora(), "d 'de' MMMM 'de' yyyy") }}
        />
      </section>
    </div>
  );
}
