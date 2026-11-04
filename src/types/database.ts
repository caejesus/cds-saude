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
}

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
