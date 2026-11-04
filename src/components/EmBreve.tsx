import { Hammer } from "lucide-react";

export function EmBreve({ titulo, sprint, itens }: { titulo: string; sprint: number; itens: string[] }) {
  return (
    <div className="space-y-6">
      <h1 className="font-titulo text-3xl font-semibold sm:text-4xl">{titulo}</h1>
      <div className="cartao max-w-xl">
        <div className="flex items-center gap-2 text-vinho-acao">
          <Hammer size={18} />
          <span className="text-sm font-medium">Em construção · Sprint {sprint}</span>
        </div>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-vinho-muted">
          {itens.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
