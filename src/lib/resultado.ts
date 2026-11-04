export type Resultado = { erro?: string; ok?: string } | undefined;

/** Mensagens do Postgres/Supabase em português. */
export function traduzErro(msg: string) {
  if (msg.includes("row-level security")) return "Você não tem permissão para esta ação.";
  if (msg.includes("duplicate key")) return "Já existe um registro com esses dados.";
  if (msg.includes("violates check constraint")) return "Algum valor informado não é válido.";
  return msg;
}

export const texto = (f: FormData, campo: string) => {
  const v = f.get(campo);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
};

export const numero = (f: FormData, campo: string) => {
  const v = texto(f, campo);
  if (v === null) return null;
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
