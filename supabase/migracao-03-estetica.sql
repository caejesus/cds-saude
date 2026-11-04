-- Sprint 4 (Estética): vínculo do atendimento com a sessão de pacote usada.
alter table public.agendamentos
  add column if not exists pacote_cliente_id uuid references public.pacotes_cliente(id) on delete set null;
create index if not exists agendamentos_pacote_idx on public.agendamentos (pacote_cliente_id);
create index if not exists fotos_cliente_idx on public.fotos_evolucao (cliente_id, criado_em);
create index if not exists termos_cliente_idx on public.termos_consentimento (cliente_id, criado_em);
