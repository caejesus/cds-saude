import { Logo } from "@/components/Logo";
import { sair } from "@/lib/acoes";

// Usuário autenticado mas sem clínica vinculada.
export default function SemClinicaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-vinho-escuro px-4 py-10">
      <div className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-6 text-center shadow-xl sm:p-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="font-titulo text-2xl font-semibold">Acesso ainda não liberado</h1>
        <p className="text-sm text-vinho-muted">
          Sua conta não está vinculada a nenhuma clínica. Fale com o suporte para concluir a instalação.
        </p>
        <form action={sair}>
          <button className="botao w-full">Voltar ao login</button>
        </form>
      </div>
    </main>
  );
}
