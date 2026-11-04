export type TipoClinica = "odonto" | "estetica" | "geral";
export type Perfil = "admin" | "gerente" | "operador" | "profissional";

export interface Clinica {
  id: string;
  nome: string;
  tipo: TipoClinica;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  logo_url: string | null;
  plano: "basico" | "profissional" | "enterprise";
  ativo: boolean;
  criado_em: string;
}

export interface Usuario {
  id: string;
  clinica_id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
}

export interface Profissional {
  id: string;
  clinica_id: string;
  usuario_id: string | null;
  nome: string;
  especialidade: string | null;
  registro: string | null;
  telefone: string | null;
  cor_agenda: string;
  ativo: boolean;
}

export interface Procedimento {
  id: string;
  clinica_id: string;
  nome: string;
  categoria: string | null;
  duracao_minutos: number;
  valor: number;
  ativo: boolean;
}

export interface Cliente {
  id: string;
  clinica_id: string;
  nome: string;
  cpf: string | null;
  data_nascimento: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  endereco: string | null;
  observacoes: string | null;
  alergias: string | null;
  ativo: boolean;
  criado_em: string;
}

export type StatusAgendamento =
  | "agendado"
  | "confirmado"
  | "em_atendimento"
  | "concluido"
  | "faltou"
  | "cancelado";

export interface Agendamento {
  id: string;
  clinica_id: string;
  cliente_id: string;
  profissional_id: string | null;
  procedimento_id: string | null;
  inicio: string;
  fim: string;
  status: StatusAgendamento;
  observacoes: string | null;
  lembrete_enviado: boolean;
  pacote_cliente_id: string | null;
}

export interface Lancamento {
  id: string;
  clinica_id: string;
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  forma_pagamento: "dinheiro" | "pix" | "debito" | "credito" | "boleto" | "outro" | null;
  vencimento: string | null;
  pago_em: string | null;
  status: "pendente" | "pago" | "cancelado";
  cliente_id: string | null;
  agendamento_id: string | null;
  categoria: string | null;
  criado_em: string;
}

export type FormaPagamento = NonNullable<Lancamento["forma_pagamento"]>;

export interface PacoteCliente {
  id: string;
  clinica_id: string;
  cliente_id: string;
  pacote_id: string | null;
  sessoes_total: number;
  sessoes_usadas: number;
  valido_ate: string | null;
  status: "ativo" | "concluido" | "expirado" | "cancelado";
}

export interface PlanoTratamento {
  id: string;
  clinica_id: string;
  cliente_id: string;
  profissional_id: string | null;
  status: "orcamento" | "aprovado" | "em_andamento" | "concluido" | "recusado";
  desconto: number;
  observacoes: string | null;
}

export interface Pacote {
  id: string;
  clinica_id: string;
  procedimento_id: string | null;
  nome: string;
  qtd_sessoes: number;
  valor: number;
  validade_dias: number;
  ativo: boolean;
}

export interface FotoEvolucao {
  id: string;
  cliente_id: string;
  agendamento_id: string | null;
  storage_path: string;
  regiao: string | null;
  momento: "antes" | "durante" | "depois" | null;
  criado_em: string;
}

export interface TermoConsentimento {
  id: string;
  clinica_id: string;
  cliente_id: string;
  procedimento_id: string | null;
  texto: string;
  aceito_em: string | null;
  assinatura_url: string | null;
  assinatura_png: string | null;
  assinado_via: "presencial" | "link" | null;
  assinado_ip: string | null;
  assinado_user_agent: string | null;
  token: string;
  token_expira_em: string;
  criado_em: string;
}
