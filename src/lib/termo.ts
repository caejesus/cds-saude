/**
 * Modelo genérico de termo de consentimento. A clínica deve revisar o texto com o
 * responsável técnico/jurídico antes de usar; ele é editável antes de cada assinatura.
 */
export function modeloTermo(d: {
  cliente: string;
  cpf: string | null;
  procedimento: string;
  clinica: string;
  cidade: string | null;
  data: string;
}) {
  return `Eu, ${d.cliente}${d.cpf ? `, CPF ${formatarCpf(d.cpf)}` : ""}, declaro que fui informado(a) de forma clara pela equipe da ${d.clinica} sobre o procedimento de ${d.procedimento}, incluindo:

1. A finalidade do procedimento, como ele é realizado e os resultados esperados, ciente de que os resultados variam de pessoa para pessoa e não podem ser garantidos.

2. Os possíveis efeitos colaterais, riscos e desconfortos, como vermelhidão, inchaço, sensibilidade, hematomas ou reações alérgicas, e os cuidados necessários antes e depois do procedimento.

3. A importância de informar alergias, doenças, uso de medicamentos, gestação ou lactação, e procedimentos anteriores. Declaro que as informações que prestei são verdadeiras.

4. O meu direito de fazer perguntas, que foram respondidas de forma satisfatória, e de desistir do procedimento a qualquer momento antes de sua realização.

5. Autorizo o registro de fotografias para acompanhamento da evolução do tratamento, de uso exclusivo da clínica e mantidas em sigilo, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018). Qualquer outro uso dependerá de nova autorização por escrito.

Diante do exposto, autorizo a realização do procedimento.

${d.cidade ? `${d.cidade}, ` : ""}${d.data}.`;
}

function formatarCpf(v: string) {
  const d = v.replace(/\D/g, "");
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : v;
}
