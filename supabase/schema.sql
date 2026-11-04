-- CDS Gestão em Saúde: schema completo de UMA instalação (uma clínica por banco).
-- Rode inteiro no SQL Editor de um projeto Supabase novo.

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
  categoria text,                         -- ex.: Procedimentos, Aluguel, Produtos
  criado_em timestamptz default now()
);
create index on public.lancamentos (clinica_id, vencimento);
create index lancamentos_pago_em_idx on public.lancamentos (clinica_id, pago_em);
create index lancamentos_agendamento_idx on public.lancamentos (agendamento_id);

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
  tipo text,
  referencia_id uuid,                     -- agendamento, lançamento etc.
  numero_destino text,
  mensagem text not null,
  status text default 'pendente' check (status in ('pendente','enviado','entregue','falhou')),
  enviado_em timestamptz,
  criado_em timestamptz default now()
);

create index whatsapp_mensagens_ref_idx on public.whatsapp_mensagens (clinica_id, tipo, referencia_id);
create index whatsapp_mensagens_cliente_idx on public.whatsapp_mensagens (clinica_id, tipo, cliente_id, criado_em);
create unique index whatsapp_templates_tipo_uidx on public.whatsapp_templates (clinica_id, tipo);

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
  assinatura_url text,                    -- legado (storage); novas assinaturas usam assinatura_png
  assinatura_png text,
  assinado_via text check (assinado_via in ('presencial', 'link')),
  assinado_ip text,
  assinado_user_agent text,
  token uuid unique default gen_random_uuid(),
  token_expira_em timestamptz default (now() + interval '48 hours'),
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

-- Vínculo do atendimento com a sessão de pacote usada (estética)
alter table public.agendamentos
  add column pacote_cliente_id uuid references public.pacotes_cliente(id) on delete set null;
create index agendamentos_pacote_idx on public.agendamentos (pacote_cliente_id);
create index fotos_cliente_idx on public.fotos_evolucao (cliente_id, criado_em);
create index termos_cliente_idx on public.termos_consentimento (cliente_id, criado_em);

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
-- Instalação: vincula o primeiro usuário (admin) à clínica.
-- Só roda pelo SQL Editor; o app não consegue chamar.
-- =========================================================
create or replace function public.instalar_clinica(
  p_email text, p_nome_clinica text, p_tipo text, p_nome_usuario text
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_id uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'Usuário % não existe. Crie em Authentication > Users > Add user.', p_email;
  end if;
  if exists (select 1 from usuarios where id = v_user) then
    raise exception 'Usuário % já está vinculado a uma clínica.', p_email;
  end if;
  insert into clinicas (nome, tipo) values (p_nome_clinica, p_tipo) returning id into v_id;
  insert into usuarios (id, clinica_id, nome, email, perfil)
    values (v_user, v_id, p_nome_usuario, lower(trim(p_email)), 'admin');
  return v_id;
end $$;

revoke execute on function public.instalar_clinica(text, text, text, text) from public, anon, authenticated;

-- Baixa de sessão de pacote quando o agendamento é concluído (estética)
create or replace function public.usar_sessao_pacote(p_pacote_cliente uuid)
returns void language plpgsql security invoker as $$
begin
  update public.pacotes_cliente
     set sessoes_usadas = sessoes_usadas + 1,
         status = case when sessoes_usadas + 1 >= sessoes_total then 'concluido' else status end
   where id = p_pacote_cliente and status = 'ativo';
end $$;

-- Leitura pública pelo token (só o necessário para o cliente ler e assinar).
create or replace function public.termo_por_token(p_token uuid)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', t.id,
    'texto', t.texto,
    'aceito_em', t.aceito_em,
    'expira_em', t.token_expira_em,
    'assinatura', t.assinatura_png,
    'cliente', c.nome,
    'cpf', c.cpf,
    'procedimento', p.nome,
    'clinica', json_build_object('nome', k.nome, 'cnpj', k.cnpj, 'endereco', k.endereco, 'cidade', k.cidade, 'estado', k.estado, 'telefone', k.telefone)
  )
  from termos_consentimento t
  join clientes c on c.id = t.cliente_id
  join clinicas k on k.id = t.clinica_id
  left join procedimentos p on p.id = t.procedimento_id
  where t.token = p_token
$$;

-- Assinatura pelo link: uma vez só, dentro da validade, imagem PNG de tamanho razoável.
create or replace function public.assinar_termo_por_token(p_token uuid, p_png text, p_ip text, p_ua text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_png is null or p_png not like 'data:image/png;base64,%' or length(p_png) > 700000 then
    raise exception 'Assinatura inválida';
  end if;
  update termos_consentimento
     set aceito_em = now(), assinatura_png = p_png, assinado_via = 'link',
         assinado_ip = left(p_ip, 100), assinado_user_agent = left(p_ua, 300)
   where token = p_token and aceito_em is null and token_expira_em > now()
  returning id into v_id;
  return v_id is not null;
end $$;

revoke all on function public.termo_por_token(uuid) from public;
revoke all on function public.assinar_termo_por_token(uuid, text, text, text) from public;
grant execute on function public.termo_por_token(uuid) to anon, authenticated;
grant execute on function public.assinar_termo_por_token(uuid, text, text, text) to anon, authenticated;

-- =========================================================
-- STORAGE: bucket privado de fotos ({clinica_id}/{cliente_id}/arquivo)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

create policy fotos_tenant_select on storage.objects for select
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = public.get_clinica_id()::text);
create policy fotos_tenant_insert on storage.objects for insert
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = public.get_clinica_id()::text);
create policy fotos_tenant_delete on storage.objects for delete
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = public.get_clinica_id()::text);
