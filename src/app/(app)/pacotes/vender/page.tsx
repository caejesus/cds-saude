import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getContexto } from "@/lib/contexto";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { hojeISO } from "@/lib/tempo";
import type { Pacote } from "@/types/database";
import { FormVenda } from "./FormVenda";

export default async function VenderPacotePage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const { cliente } = await searchParams;
  const { supabase } = await getContexto();
  const [{ data: clientes }, { data: modelos }] = await Promise.all([
    supabase.from("clientes").select("id, nome").eq("ativo", true).order("nome").limit(2000).returns<{ id: string; nome: string }[]>(),
    supabase.from("pacotes").select("*").eq("ativo", true).order("nome").returns<Pacote[]>(),
  ]);
  return (
    <div className="max-w-3xl space-y-6">
      <Link href={cliente ? `/clientes/${cliente}` : "/pacotes"} className="inline-flex items-center gap-1 text-sm text-vinho-muted hover:text-vinho-acao">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <Cabecalho titulo="Vender pacote" descricao="As parcelas entram automaticamente no financeiro." />
      <section className="cartao">
        {(modelos ?? []).length === 0 ? (
          <p className="text-sm text-vinho-muted">
            Crie um pacote primeiro em <Link href="/pacotes" className="font-medium text-vinho-acao hover:underline">Pacotes</Link>.
          </p>
        ) : (
          <FormVenda clientes={clientes ?? []} modelos={modelos ?? []} clienteInicial={cliente} hoje={hojeISO()} />
        )}
      </section>
    </div>
  );
}
