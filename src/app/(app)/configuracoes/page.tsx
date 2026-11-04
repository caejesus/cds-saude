import { getContexto } from "@/lib/contexto";
import { Cabecalho } from "@/components/ui/Cabecalho";
import type { Procedimento, Profissional } from "@/types/database";
import { FormClinica } from "./Formularios";
import { ListaProcedimentos, ListaProfissionais } from "./Listas";

export default async function ConfiguracoesPage() {
  const { supabase, clinica, usuario } = await getContexto();
  const [{ data: profissionais }, { data: procedimentos }] = await Promise.all([
    supabase.from("profissionais").select("*").order("ativo", { ascending: false }).order("nome").returns<Profissional[]>(),
    supabase.from("procedimentos").select("*").order("ativo", { ascending: false }).order("nome").returns<Procedimento[]>(),
  ]);

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Configurações" descricao="Dados da clínica, equipe e serviços oferecidos." />

      <section className="cartao">
        <h2 className="mb-4 font-titulo text-xl font-semibold">Dados da clínica</h2>
        <FormClinica clinica={clinica} podeEditar={usuario.perfil === "admin"} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="cartao">
          <h2 className="mb-2 font-titulo text-xl font-semibold">Profissionais</h2>
          <ListaProfissionais itens={profissionais ?? []} />
        </section>
        <section className="cartao">
          <h2 className="mb-2 font-titulo text-xl font-semibold">Procedimentos</h2>
          <ListaProcedimentos itens={procedimentos ?? []} />
        </section>
      </div>
    </div>
  );
}
