export function Cabecalho({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-titulo text-3xl font-semibold sm:text-4xl">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-vinho-muted">{descricao}</p>}
      </div>
      {acao}
    </header>
  );
}
