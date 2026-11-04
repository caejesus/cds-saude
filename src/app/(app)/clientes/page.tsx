import Link from "next/link";
import { AlertTriangle, Plus, Search } from "lucide-react";
import { getContexto } from "@/lib/contexto";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { fmt } from "@/lib/tempo";
import { telefoneBR } from "@/lib/formato";
import type { Cliente } from "@/types/database";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string; inativos?: string }> }) {
  const { q = "", inativos } = await searchParams;
  const { supabase } = await getContexto();
  const busca = q.trim();

  let consulta = supabase.from("clientes").select("*").order("nome").limit(200);
  if (!inativos) consulta = consulta.eq("ativo", true);
  if (busca) {
    const digitos = busca.replace(/\D/g, "");
    const termo = busca.replace(/[%,()]/g, " ");
    consulta = digitos.length >= 3
      ? consulta.or(`nome.ilike.%${termo}%,whatsapp.ilike.%${digitos}%,telefone.ilike.%${digitos}%,cpf.ilike.%${digitos}%`)
      : consulta.ilike("nome", `%${termo}%`);
  }
  const { data: clientes } = await consulta.returns<Cliente[]>();
  const lista = clientes ?? [];

  return (
    <div className="space-y-6">
      <Cabecalho
        titulo="Clientes"
        descricao={`${lista.length}${lista.length === 200 ? "+" : ""} ${busca ? "encontrado(s)" : "cadastrado(s)"}`}
        acao={
          <Link href="/clientes/novo" className="botao">
            <Plus size={16} /> Novo cliente
          </Link>
        }
      />

      <form className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-vinho-muted" />
          <input name="q" defaultValue={busca} placeholder="Buscar por nome, WhatsApp ou CPF" className="campo pl-9" />
        </div>
        <label className="flex items-center gap-2 text-sm text-vinho-muted">
          <input type="checkbox" name="inativos" value="1" defaultChecked={!!inativos} className="accent-vinho-acao" /> Inativos
        </label>
        <button className="botao-sec">Buscar</button>
      </form>

      <section className="cartao-lista">
        {lista.length === 0 ? (
          <p className="p-8 text-center text-sm text-vinho-muted">
            {busca ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
          </p>
        ) : (
          <ul className="divide-y divide-vinho-borda">
            {lista.map((c) => (
              <li key={c.id}>
                <Link href={`/clientes/${c.id}`} className={`flex items-center gap-3 px-5 py-3 transition hover:bg-vinho-fundo ${c.ativo ? "" : "opacity-55"}`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-vinho-fundo font-titulo text-lg font-semibold text-vinho-acao">
                    {c.nome.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {c.nome}
                      {c.alergias && <AlertTriangle size={14} className="shrink-0 text-amber-600" aria-label="Possui alergias" />}
                    </p>
                    <p className="truncate text-xs text-vinho-muted">
                      {[telefoneBR(c.whatsapp || c.telefone), c.data_nascimento && fmt(c.data_nascimento + "T12:00:00Z", "dd/MM/yyyy")].filter(Boolean).join(" · ") || "Sem contato"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
