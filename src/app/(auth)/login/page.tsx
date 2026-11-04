"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { marca } from "@/lib/marca";

const SUPORTE = marca.whatsappSuporte
  ? `https://wa.me/${marca.whatsappSuporte}?text=${encodeURIComponent(`Olá! Preciso de ajuda com o acesso ao sistema ${marca.nome}.`)}`
  : "";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { error } = await createClient().auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      setErro(error.message === "Invalid login credentials" ? "Email ou senha incorretos." : error.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={entrar} className="space-y-4">
      <h1 className="font-titulo text-2xl font-semibold">Entrar</h1>
      <label className="block text-sm">
        Email
        <input className="campo mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <label className="block text-sm">
        Senha
        <input className="campo mt-1" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
      </label>
      {erro && <p className="text-sm text-red-700">{erro}</p>}
      <button className="botao w-full" disabled={carregando}>
        {carregando ? "Entrando..." : "Entrar"}
      </button>
      {SUPORTE && (
        <p className="text-center text-sm text-vinho-muted">
          Problemas para entrar?{" "}
          <a href={SUPORTE} target="_blank" rel="noopener noreferrer" className="font-medium text-vinho-acao hover:underline">
            Fale com o suporte
          </a>
        </p>
      )}
    </form>
  );
}
