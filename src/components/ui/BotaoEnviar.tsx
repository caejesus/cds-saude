"use client";
import { useFormStatus } from "react-dom";

export function BotaoEnviar({ children, className = "", variante = "primario" }: {
  children: React.ReactNode;
  className?: string;
  variante?: "primario" | "secundario";
}) {
  const { pending } = useFormStatus();
  const estilo =
    variante === "primario"
      ? "botao"
      : "inline-flex items-center justify-center gap-2 rounded-lg border border-vinho-borda bg-white px-4 py-2 text-sm text-vinho-escuro transition hover:border-vinho-medio disabled:opacity-60";
  return (
    <button className={`${estilo} ${className}`} disabled={pending}>
      {pending ? "Salvando..." : children}
    </button>
  );
}
