/** Modelos de mensagem de WhatsApp. A clínica pode sobrescrever cada um em /whatsapp. */
export type TipoMensagem = "lembrete" | "pos_atendimento" | "aniversario" | "cobranca";

export const MODELOS: Record<TipoMensagem, { titulo: string; texto: string; campos: string[] }> = {
  lembrete: {
    titulo: "Lembrete / confirmação",
    texto:
      "Olá, {nome}! Tudo bem? 😊\nPassando para lembrar do seu horário na {clinica}:\n📅 {data} às {hora}\n💆 {procedimento}\n\nPodemos confirmar sua presença? Responda *SIM* para confirmar ou nos avise se precisar remarcar.",
    campos: ["nome", "clinica", "data", "hora", "procedimento", "profissional"],
  },
  pos_atendimento: {
    titulo: "Pós-atendimento",
    texto:
      "Oi, {nome}! Aqui é da {clinica}. Passando para saber como você está depois do seu {procedimento} 💕\nQualquer dúvida sobre os cuidados, é só chamar por aqui. Sua opinião é muito importante para nós!",
    campos: ["nome", "clinica", "procedimento", "profissional"],
  },
  aniversario: {
    titulo: "Aniversário",
    texto:
      "Feliz aniversário, {nome}! 🎉🎂\nToda a equipe da {clinica} deseja um novo ciclo cheio de saúde e autoestima. Para comemorar, preparamos um mimo especial para você neste mês. Quer saber qual é?",
    campos: ["nome", "clinica"],
  },
  cobranca: {
    titulo: "Cobrança",
    texto:
      "Olá, {nome}, tudo bem? Aqui é da {clinica}.\nConsta em aberto o valor de {valor}, com vencimento em {vencimento}. Se já pagou, por favor desconsidere esta mensagem. Se precisar, podemos te enviar a chave Pix. 🙏",
    campos: ["nome", "clinica", "valor", "vencimento"],
  },
};

export function preencher(texto: string, vars: Record<string, string | null | undefined>) {
  return texto.replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] ?? "").toString() || m.replace(/[{}]/g, ""));
}

export function linkWhatsApp(numero: string | null | undefined, texto: string) {
  const d = (numero ?? "").replace(/\D/g, "");
  const n = d ? (d.length <= 11 ? `55${d}` : d) : "";
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
}
