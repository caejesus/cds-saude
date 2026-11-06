import { Sidebar } from "@/components/Sidebar";
import { getContexto } from "@/lib/contexto";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { usuario, clinica } = await getContexto();
  return (
    <div className="min-h-screen">
      <Sidebar tipo={clinica.tipo} nomeClinica={clinica.nome} nomeUsuario={usuario.nome} logoUrl={clinica.logo_url} />
      <main className="px-4 py-6 md:ml-[220px] md:px-8 md:py-8">{children}</main>
    </div>
  );
}
