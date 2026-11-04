"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Smile, Sparkles, Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import type { TipoClinica } from "@/types/database";

const TIPOS: { valor: TipoClinica; rotulo: string; icone: typeof Smile }[] = [
  { valor: "odonto", rotulo: "Odontologia", icone: Smile },
  { valor: "estetica", rotulo: "Estética", icone: Sparkles },
  { valor: "geral", rotulo: "Outra", icone: Stethoscope },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [nomeClinica, setNomeClinica] = useState("");
  const [seuNome, setSeuNome] = useState("");
  const [tipo, setTipo] = useState<TipoClinica>("odonto");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { error } = await createClient().rpc("criar_clinica", {
      p_nome: nomeClinica.trim(),
      p_tipo: tipo,
      p_nome_usuario: seuNome.trim(),
    });
    setCarregando(false);
    if (error && !error.message.includes("já vinculado")) return setErro(error.message);
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-vinho-escuro px-4 py-10">
      <form onSubmit={criar} className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <Logo />
        <h1 className="font-titulo text-2xl font-semibold">Sua clínica</h1>
        <label className="block text-sm">
          Nome da clínica
          <input className="campo mt-1" required value={nomeClinica} onChange={(e) => setNomeClinica(e.target.value)} />
        </label>
        <label className="block text-sm">
          Seu nome
          <input className="campo mt-1" required value={seuNome} onChange={(e) => setSeuNome(e.target.value)} />
        </label>
        <fieldset>
          <legend className="mb-2 text-sm">Tipo de clínica</legend>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS.map(({ valor, rotulo, icone: Icone }) => (
              <button
                type="button"
                key={valor}
                onClick={() => setTipo(valor)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition ${
                  tipo === valor
                    ? "border-vinho-acao bg-vinho-fundo text-vinho-acao"
                    : "border-vinho-borda text-vinho-muted hover:border-vinho-medio"
                }`}
              >
                <Icone size={20} />
                {rotulo}
              </button>
            ))}
          </div>
        </fieldset>
        {erro && <p className="text-sm text-red-700">{erro}</p>}
        <button className="botao w-full" disabled={carregando}>
          {carregando ? "Criando..." : "Começar"}
        </button>
      </form>
    </main>
  );
}
