"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CadastroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (senha.length < 6) return setErro("A senha precisa ter pelo menos 6 caracteres.");
    setCarregando(true);
    const { data, error } = await createClient().auth.signUp({ email, password: senha });
    setCarregando(false);
    if (error) return setErro(error.message);
    if (!data.session) {
      setAviso("Enviamos um link de confirmação para seu email. Confirme e depois entre.");
      return;
    }
    router.replace("/onboarding");
    router.refresh();
  }

  if (aviso) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="font-titulo text-2xl font-semibold">Quase lá</h1>
        <p className="text-sm text-vinho-muted">{aviso}</p>
        <Link href="/login" className="botao w-full">Ir para o login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={cadastrar} className="space-y-4">
      <h1 className="font-titulo text-2xl font-semibold">Criar conta</h1>
      <label className="block text-sm">
        Email
        <input className="campo mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <label className="block text-sm">
        Senha
        <input className="campo mt-1" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
      </label>
      {erro && <p className="text-sm text-red-700">{erro}</p>}
      <button className="botao w-full" disabled={carregando}>
        {carregando ? "Criando..." : "Continuar"}
      </button>
      <p className="text-center text-sm text-vinho-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-vinho-acao hover:underline">Entrar</Link>
      </p>
    </form>
  );
}
