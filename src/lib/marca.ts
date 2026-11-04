/**
 * Identidade visual da instalação. Cada clínica tem o próprio deploy,
 * com estas variáveis definidas na Vercel (ou no .env.local).
 */
const hex = (v: string | undefined, padrao: string) =>
  v && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : padrao;

export const marca = {
  nome: process.env.NEXT_PUBLIC_MARCA_NOME || "CDS",
  subtitulo: process.env.NEXT_PUBLIC_MARCA_SUBTITULO ?? "gestão em saúde",
  /** Caminho em /public (ex.: /logo.png) ou URL completa. Vazio = logo em texto. */
  logo: process.env.NEXT_PUBLIC_MARCA_LOGO || "",
  corPrimaria: hex(process.env.NEXT_PUBLIC_COR_PRIMARIA, "#7d1635"),
  corEscura: hex(process.env.NEXT_PUBLIC_COR_ESCURA, "#2d0a1e"),
  whatsappSuporte: process.env.NEXT_PUBLIC_WHATSAPP_SUPORTE || "",
};
