import { TZDate } from "@date-fns/tz";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Fuso da clínica. O servidor (Vercel) roda em UTC, então tudo passa por aqui. */
export const FUSO = process.env.NEXT_PUBLIC_FUSO || "America/Manaus";

export const agora = () => TZDate.tz(FUSO);

/** Data de hoje no fuso da clínica, no formato yyyy-MM-dd. */
export const hojeISO = () => format(agora(), "yyyy-MM-dd");

/** Valida yyyy-MM-dd; se inválida, devolve hoje. */
export function dataValida(v: string | undefined | null) {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : hojeISO();
}

/** "2026-11-04" + "09:30" no fuso da clínica → Date (instante absoluto). */
export function deLocal(data: string, hora = "00:00") {
  const [a, m, d] = data.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  return new Date(new TZDate(a, m - 1, d, h || 0, min || 0, FUSO).getTime());
}

/** Intervalo [início, fim) do dia no fuso da clínica, em ISO (UTC). */
export function limitesDoDia(data: string) {
  const inicio = deLocal(data);
  const fim = deLocal(format(addDays(new TZDate(inicio, FUSO), 1), "yyyy-MM-dd"));
  return { inicio: inicio.toISOString(), fim: fim.toISOString() };
}

export const somarDias = (data: string, n: number) =>
  format(addDays(new TZDate(deLocal(data), FUSO), n), "yyyy-MM-dd");

/** Formata um timestamp do banco no fuso da clínica. */
export const fmt = (iso: string | Date, padrao: string) =>
  format(new TZDate(new Date(iso).getTime(), FUSO), padrao, { locale: ptBR });

/** Mês atual no fuso da clínica (yyyy-MM). */
export const mesAtual = () => hojeISO().slice(0, 7);

export function mesValido(v: string | undefined | null) {
  return v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : mesAtual();
}

/** Soma meses a "yyyy-MM". */
export function somarMeses(mes: string, n: number) {
  const [a, m] = mes.split("-").map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/** Primeiro dia do mês e do mês seguinte (datas, sem hora). */
export const limitesDoMes = (mes: string) => ({ inicio: `${mes}-01`, fim: `${somarMeses(mes, 1)}-01` });

/** Soma meses a uma data yyyy-MM-dd mantendo o dia (ajusta para o último dia se não existir). */
export function somarMesesData(data: string, n: number) {
  const [a, m, d] = data.split("-").map(Number);
  const alvo = somarMeses(`${a}-${String(m).padStart(2, "0")}`, n);
  const [aa, mm] = alvo.split("-").map(Number);
  const ultimo = new Date(Date.UTC(aa, mm, 0)).getUTCDate();
  return `${alvo}-${String(Math.min(d, ultimo)).padStart(2, "0")}`;
}

/** Formata data pura (yyyy-MM-dd) sem deslocamento de fuso. */
export const fmtData = (data: string, padrao = "dd/MM/yyyy") => fmt(deLocal(data, "12:00"), padrao);
