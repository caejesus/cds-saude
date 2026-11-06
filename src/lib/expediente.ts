/** Expediente padrão (depois vira configuração por clínica/profissional). */
export const EXPEDIENTE = { inicio: "08:00", fim: "18:00", passoMin: 15 };

export const paraMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const paraHora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export type Ocupado = { id: string; inicio: string; fim: string; cliente: string; procedimento: string | null; status: string };
export type Trecho = { tipo: "ocupado"; ini: number; fim: number; item: Ocupado } | { tipo: "livre"; ini: number; fim: number };

/** Divide o expediente em trechos ocupados e livres. */
export function trechosDoDia(ocupados: Ocupado[], agoraMin: number | null) {
  const ini = paraMin(EXPEDIENTE.inicio);
  const fim = paraMin(EXPEDIENTE.fim);
  const ord = [...ocupados].sort((a, b) => paraMin(a.inicio) - paraMin(b.inicio));
  const trechos: Trecho[] = [];
  let cursor = agoraMin !== null ? Math.max(ini, agoraMin) : ini;
  for (const o of ord) {
    const oi = paraMin(o.inicio);
    const of = paraMin(o.fim);
    if (oi > cursor && cursor < fim) trechos.push({ tipo: "livre", ini: cursor, fim: Math.min(oi, fim) });
    trechos.push({ tipo: "ocupado", ini: oi, fim: of, item: o });
    cursor = Math.max(cursor, of);
  }
  if (cursor < fim) trechos.push({ tipo: "livre", ini: cursor, fim });
  return trechos;
}

/** Horários de início (de 15 em 15 min) onde cabe a duração sem sobrepor ninguém. */
export function horariosLivres(ocupados: Ocupado[], duracao: number, agoraMin: number | null) {
  const ini = paraMin(EXPEDIENTE.inicio);
  const fim = paraMin(EXPEDIENTE.fim);
  const blocos = ocupados.map((o) => [paraMin(o.inicio), paraMin(o.fim)] as const);
  const lista: string[] = [];
  const primeiro = agoraMin !== null ? Math.ceil(Math.max(ini, agoraMin) / EXPEDIENTE.passoMin) * EXPEDIENTE.passoMin : ini;
  for (let t = primeiro; t + duracao <= fim; t += EXPEDIENTE.passoMin) {
    if (!blocos.some(([a, b]) => t < b && t + duracao > a)) lista.push(paraHora(t));
  }
  return lista;
}
