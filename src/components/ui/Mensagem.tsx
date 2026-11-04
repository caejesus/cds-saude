import type { Resultado } from "@/lib/resultado";

export function Mensagem({ estado }: { estado: Resultado }) {
  if (estado?.erro) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{estado.erro}</p>;
  if (estado?.ok) return <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{estado.ok}</p>;
  return null;
}
