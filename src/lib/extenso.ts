/** Valor em reais por extenso (pt-BR): 1250.5 → "mil duzentos e cinquenta reais e cinquenta centavos". */
const UNIDADES = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function ate999(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const r = n % 100;
  const partes: string[] = [];
  if (c) partes.push(CENTENAS[c]);
  if (r) {
    if (r < 20) partes.push(UNIDADES[r]);
    else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      partes.push(u ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d]);
    }
  }
  return partes.join(" e ");
}

function inteiro(n: number): string {
  if (n === 0) return "zero";
  const grupos: { valor: number; sing: string; plur: string }[] = [
    { valor: Math.floor(n / 1_000_000_000) % 1000, sing: "bilhão", plur: "bilhões" },
    { valor: Math.floor(n / 1_000_000) % 1000, sing: "milhão", plur: "milhões" },
    { valor: Math.floor(n / 1000) % 1000, sing: "mil", plur: "mil" },
    { valor: n % 1000, sing: "", plur: "" },
  ];
  const partes: { texto: string; valor: number }[] = [];
  for (const g of grupos) {
    if (!g.valor) continue;
    if (g.sing === "mil") partes.push({ texto: g.valor === 1 ? "mil" : `${ate999(g.valor)} mil`, valor: g.valor });
    else if (g.sing) partes.push({ texto: `${ate999(g.valor)} ${g.valor === 1 ? g.sing : g.plur}`, valor: g.valor });
    else partes.push({ texto: ate999(g.valor), valor: g.valor });
  }
  // "e" antes do último grupo quando ele é < 100 ou centena redonda (ex.: mil e duzentos; mil duzentos e cinquenta)
  return partes
    .map((p, i) => {
      if (i === 0) return p.texto;
      const ultimo = i === partes.length - 1;
      const usaE = ultimo && (p.valor < 100 || p.valor % 100 === 0);
      return `${usaE ? "e " : ""}${p.texto}`;
    })
    .join(" ");
}

export function valorPorExtenso(valor: number) {
  const centavosTotal = Math.round(Math.abs(valor) * 100);
  const reais = Math.floor(centavosTotal / 100);
  const centavos = centavosTotal % 100;
  const partes: string[] = [];
  if (reais) {
    const t = inteiro(reais);
    const de = reais >= 1_000_000 && reais % 1_000_000 === 0 ? " de" : "";
    partes.push(`${t}${de} ${reais === 1 ? "real" : "reais"}`);
  }
  if (centavos) partes.push(`${inteiro(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
  return partes.length ? partes.join(" e ") : "zero real";
}
