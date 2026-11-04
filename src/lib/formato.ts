export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Formata telefone brasileiro guardado só com dígitos. */
export const telefoneBR = (v: string | null) => {
  if (!v) return "";
  const d = v.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v;
};


/** Link de WhatsApp a partir do número salvo (assume Brasil se vier sem DDI). */
export const linkWhatsapp = (v: string | null, mensagem?: string) => {
  if (!v) return null;
  const d = v.replace(/\D/g, "");
  const n = d.length <= 11 ? `55${d}` : d;
  return `https://wa.me/${n}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ""}`;
};

export const idade = (nascimento: string | null) => {
  if (!nascimento) return null;
  const [a, m, d] = nascimento.split("-").map(Number);
  const hoje = new Date();
  let i = hoje.getFullYear() - a;
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) i--;
  return i;
};

export const FORMAS: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  debito: "Débito",
  credito: "Crédito",
  boleto: "Boleto",
  outro: "Outro",
};

export const CATEGORIAS_ENTRADA = ["Procedimentos", "Pacotes", "Produtos", "Outras receitas"];
export const CATEGORIAS_SAIDA = ["Aluguel", "Produtos e insumos", "Salários e comissões", "Energia e água", "Internet e telefone", "Marketing", "Impostos", "Equipamentos", "Outras despesas"];
