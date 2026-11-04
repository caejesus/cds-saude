# CDS Gestão em Saúde — Setup v2 (núcleo + odonto + estética)

Produto próprio da Caetano Digital Systems. SaaS multi-tenant: uma base única para
clínicas, com módulos que ligam conforme o tipo da clínica.

Stack: Next.js (App Router) · Supabase · TypeScript · Tailwind · Vercel
Identidade: vinho — `#2D0A1E` escuro · `#7D1635` ação · `#C07090` médio · `#FBF3F6` fundo
Fontes: Cormorant Garamond (títulos) · DM Sans (corpo)

---

## Arquitetura em uma linha

`clinicas.tipo` = `odonto` | `estetica` | `geral` → o menu e as telas extras aparecem
conforme o tipo. Tudo o mais (agenda, clientes, financeiro, WhatsApp) é compartilhado.

| Núcleo (todas) | Odonto | Estética |
|---|---|---|
| Clientes / prontuário | Odontograma | Fotos antes/depois |
| Agenda por profissional | Plano de tratamento (orçamento) | Pacotes de sessões |
| Procedimentos | | Termo de consentimento |
| Financeiro / caixa | | Ficha de anamnese estética |
| WhatsApp (lembretes) | | |
| Dashboard | | |

---

## Passo 1 — Dependências

```bash
cd C:\Users\thyag\cds-saude
npm install @supabase/supabase-js @supabase/ssr lucide-react date-fns
```

## Passo 2 — `.env.local` (raiz do projeto, NÃO commitar)

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
```

Supabase: Settings → API. Projeto da conta `sistemadigitalclinica@gmail.com`.

## Passo 3 — SQL (Supabase → SQL Editor → colar tudo → Run)

```sql
create extension if not exists "uuid-ossp";

-- =========================================================
-- NÚCLEO
-- =========================================================
create table public.clinicas (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  tipo text not null default 'geral' check (tipo in ('odonto','estetica','geral')),
  cnpj text,
  telefone text,
  email text,
  endereco text,
  cidade text,
  estado text,
  logo_url text,
  plano text default 'basico' check (plano in ('basico','profissional','enterprise')),
  ativo boolean default true,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create table public.usuarios (
  id uuid references auth.users(id) on delete cascade primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  nome text not null,
  email text not null,
  perfil text default 'operador' check (perfil in ('admin','gerente','operador','profissional')),
  ativo boolean default true,
  criado_em timestamptz default now()
);

create table public.profissionais (
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  usuario_id uuid references public.usuarios(id) on delete set null,
  nome text not null,
  especialidade text,
  registro text,              -- CRO, CRM, etc.
  telefone text,
  cor_agenda text default '#7D1635',
  ativo boolean default true,
  criado_em timestamptz default now()
);

create table public.procedimentos (
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  nome text not null,
  categoria text,
  duracao_minutos integer default 60,
  valor numeric(10,2) default 0,
  ativo boolean default true,
  criado_em timestamptz default now()
);

create table public.clientes (
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  nome text not null,
  cpf text,
  data_nascimento date,
  telefone text,
  whatsapp text,
  email text,
  endereco text,
  observacoes text,
  alergias text,
  ativo boolean default true,
  criado_em timestamptz default now()
);

create table public.agendamentos (
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  profissional_id uuid references public.profissionais(id) on delete set null,
  procedimento_id uuid references public.procedimentos(id) on delete set null,
  inicio timestamptz not null,
  fim timestamptz not null,
  status text default 'agendado'
    check (status in ('agendado','confirmado','em_atendimento','concluido','faltou','cancelado')),
  observacoes text,
  lembrete_enviado boolean default false,
  criado_em timestamptz default now()
);
create index on public.agendamentos (clinica_id, inicio);

create table public.evolucoes (           -- anotações de prontuário por atendimento
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  agendamento_id uuid references public.agendamentos(id) on delete set null,
  profissional_id uuid references public.profissionais(id) on delete set null,
  texto text not null,
  criado_em timestamptz default now()
);

create table public.lancamentos (         -- financeiro: entradas e saídas
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  tipo text not null check (tipo in ('entrada','saida')),
  descricao text not null,
  valor numeric(10,2) not null,
  forma_pagamento text check (forma_pagamento in ('dinheiro','pix','debito','credito','boleto','outro')),
  vencimento date,
  pago_em date,
  status text default 'pendente' check (status in ('pendente','pago','cancelado')),
  cliente_id uuid references public.clientes(id) on delete set null,
  agendamento_id uuid references public.agendamentos(id) on delete set null,
  origem_tipo text,                       -- 'plano_tratamento' | 'pacote' | null
  origem_id uuid,
  criado_em timestamptz default now()
);
create index on public.lancamentos (clinica_id, vencimento);

create table public.whatsapp_templates (
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  nome text not null,
  tipo text not null check (tipo in ('lembrete','confirmacao','pos_atendimento','cobranca','reativacao','aniversario')),
  mensagem text not null,
  ativo boolean default true,
  criado_em timestamptz default now()
);

create table public.whatsapp_mensagens (
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  cliente_id uuid references public.clientes(id) on delete cascade,
  template_id uuid references public.whatsapp_templates(id) on delete set null,
  numero_destino text not null,
  mensagem text not null,
  status text default 'pendente' check (status in ('pendente','enviado','entregue','falhou')),
  enviado_em timestamptz,
  criado_em timestamptz default now()
);

-- =========================================================
-- MÓDULO ODONTO
-- =========================================================
create table public.odontograma (         -- estado atual de cada dente/face
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  dente smallint not null,                -- numeração FDI: 11–48 (permanentes), 51–85 (decíduos)
  face text check (face in ('M','D','O','V','L','I','inteiro')),
  condicao text not null,                 -- 'higido','carie','restaurado','ausente','canal','implante','coroa'...
  observacao text,
  atualizado_em timestamptz default now(),
  unique (cliente_id, dente, face)
);

create table public.planos_tratamento (   -- orçamento odontológico
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  profissional_id uuid references public.profissionais(id) on delete set null,
  status text default 'orcamento' check (status in ('orcamento','aprovado','em_andamento','concluido','recusado')),
  desconto numeric(10,2) default 0,
  observacoes text,
  criado_em timestamptz default now()
);

create table public.planos_tratamento_itens (
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  plano_id uuid references public.planos_tratamento(id) on delete cascade not null,
  procedimento_id uuid references public.procedimentos(id) on delete set null,
  dente smallint,
  face text,
  valor numeric(10,2) not null,
  status text default 'pendente' check (status in ('pendente','realizado')),
  realizado_em date
);

-- =========================================================
-- MÓDULO ESTÉTICA
-- =========================================================
create table public.pacotes (             -- modelo: "10 sessões de drenagem"
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  procedimento_id uuid references public.procedimentos(id) on delete set null,
  nome text not null,
  qtd_sessoes integer not null,
  valor numeric(10,2) not null,
  validade_dias integer default 180,
  ativo boolean default true
);

create table public.pacotes_cliente (     -- pacote vendido + saldo
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  pacote_id uuid references public.pacotes(id) on delete set null,
  sessoes_total integer not null,
  sessoes_usadas integer default 0,
  valido_ate date,
  status text default 'ativo' check (status in ('ativo','concluido','expirado','cancelado')),
  criado_em timestamptz default now()
);

create table public.fotos_evolucao (      -- antes/depois
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  agendamento_id uuid references public.agendamentos(id) on delete set null,
  storage_path text not null,             -- bucket privado 'fotos'
  regiao text,
  momento text check (momento in ('antes','durante','depois')),
  criado_em timestamptz default now()
);

create table public.termos_consentimento (
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  procedimento_id uuid references public.procedimentos(id) on delete set null,
  texto text not null,
  aceito_em timestamptz,
  assinatura_url text,
  criado_em timestamptz default now()
);

create table public.anamneses (           -- ficha flexível (estética e odonto)
  id uuid default uuid_generate_v4() primary key,
  clinica_id uuid references public.clinicas(id) on delete cascade not null,
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  tipo text not null,                     -- 'estetica_facial','corporal','odonto'...
  respostas jsonb not null default '{}',
  criado_em timestamptz default now()
);

-- =========================================================
-- RLS multi-tenant
-- =========================================================
create or replace function public.get_clinica_id()
returns uuid language sql stable security definer set search_path = public as $$
  select clinica_id from public.usuarios where id = auth.uid()
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'usuarios','profissionais','procedimentos','clientes','agendamentos','evolucoes',
    'lancamentos','whatsapp_templates','whatsapp_mensagens','odontograma',
    'planos_tratamento','planos_tratamento_itens','pacotes','pacotes_cliente',
    'fotos_evolucao','termos_consentimento','anamneses'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for all using (clinica_id = public.get_clinica_id()) with check (clinica_id = public.get_clinica_id())',
      t || '_tenant', t);
  end loop;
end $$;

alter table public.clinicas enable row level security;
create policy clinicas_propria on public.clinicas
  for select using (id = public.get_clinica_id());
create policy clinicas_admin_update on public.clinicas
  for update using (
    id = public.get_clinica_id()
    and exists (select 1 from public.usuarios where id = auth.uid() and perfil = 'admin')
  );

-- =========================================================
-- Onboarding: cria clínica + admin para o usuário recém-cadastrado
-- (chamar via supabase.rpc('criar_clinica', {...}) logo após o signUp)
-- =========================================================
create or replace function public.criar_clinica(p_nome text, p_tipo text, p_nome_usuario text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  if exists (select 1 from usuarios where id = auth.uid()) then
    raise exception 'usuário já vinculado a uma clínica';
  end if;
  insert into clinicas (nome, tipo) values (p_nome, p_tipo) returning id into v_id;
  insert into usuarios (id, clinica_id, nome, email, perfil)
    values (auth.uid(), v_id, p_nome_usuario,
            (select email from auth.users where id = auth.uid()), 'admin');
  return v_id;
end $$;

-- Baixa de sessão de pacote quando o agendamento é concluído (estética)
create or replace function public.usar_sessao_pacote(p_pacote_cliente uuid)
returns void language plpgsql security invoker as $$
begin
  update public.pacotes_cliente
     set sessoes_usadas = sessoes_usadas + 1,
         status = case when sessoes_usadas + 1 >= sessoes_total then 'concluido' else status end
   where id = p_pacote_cliente and status = 'ativo';
end $$;
```

## Passo 4 — Storage

Supabase → Storage → criar bucket **`fotos`**, **privado**. Caminho dos arquivos:
`{clinica_id}/{cliente_id}/{arquivo}`. Política: só lê/grava quem tem
`(storage.foldername(name))[1] = get_clinica_id()::text`.

---

## Passo 5 — Sprint 1 (JÁ FEITO, os arquivos estão no projeto)

Login, cadastro, onboarding da clínica, sidebar por tipo, dashboard e tipos já estão em `src/`.
Rode `npm install` e `npm run dev`. O prompt abaixo fica como referência.

### Prompt original

Cole no Claude Code com a pasta `cds-saude` aberta:

```
Leia o SETUP.md da raiz. É o CDS Gestão em Saúde: SaaS multi-tenant para clínicas
(Next.js App Router + Supabase + TypeScript + Tailwind). O schema SQL já foi aplicado no
Supabase com RLS ativo — nunca desabilite RLS e nunca use a service role no cliente.

Sprint 1 — base funcionando:

1. src/lib/supabase/client.ts e server.ts com @supabase/ssr, e middleware.ts que
   protege tudo exceto /login e /cadastro.
2. Tailwind: cores vinho (escuro #2D0A1E, acao #7D1635, medio #C07090, fundo #FBF3F6,
   borda #F0D8E2, muted #9E7080) e fontes Cormorant Garamond (font-titulo) e DM Sans
   (font-corpo) via next/font.
3. /login (email e senha) e /cadastro: cria a conta com supabase.auth.signUp e depois
   chama supabase.rpc('criar_clinica', { p_nome, p_tipo, p_nome_usuario }), com o tipo
   escolhido entre Odontologia, Estética e Outra.
4. Layout do dashboard: sidebar fixa (220px, fundo #2D0A1E), itens Dashboard, Agenda,
   Clientes, Financeiro, WhatsApp, Configurações. Itens extras conforme clinicas.tipo:
   odonto → "Tratamentos"; estetica → "Pacotes". Responsivo: no celular a sidebar vira
   menu hambúrguer.
5. Hook/serviço useClinica() que carrega a clínica do usuário (tipo, nome) uma vez e
   alimenta o menu.
6. /dashboard (Server Component): cards Consultas hoje, Clientes ativos, Recebido no mês,
   A receber vencido; lista das consultas do dia vindas de agendamentos.
7. Tipos TypeScript das tabelas em src/types/database.ts.

Ao terminar, rode npm run build, corrija os erros e me diga o que testar.
```

## Próximos sprints

- **Sprint 2 — Agenda e clientes:** agenda semanal por profissional, cadastro de cliente
  com prontuário (evoluções), procedimentos.
- **Sprint 3 — Financeiro:** lançamentos, caixa do dia, contas a receber.
- **Sprint 4 — Módulos:** odontograma clicável + plano de tratamento que gera lançamentos;
  pacotes com saldo de sessões, fotos antes/depois e termo de consentimento.
- **Sprint 5 — WhatsApp:** Evolution API, lembrete automático 24h antes e confirmação.

## Checklist Sprint 1

- [ ] Dependências instaladas
- [ ] `.env.local` preenchido
- [ ] SQL rodado sem erro
- [ ] Bucket `fotos` privado criado
- [ ] Cadastro cria clínica + admin
- [ ] Login redireciona para /dashboard
- [ ] Menu muda conforme o tipo da clínica
- [ ] Teste de isolamento: duas contas de clínicas diferentes não veem dados uma da outra
- [ ] Commit, push para `caejesus/cds-saude` e deploy na Vercel
