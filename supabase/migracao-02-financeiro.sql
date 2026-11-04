-- Sprint 3 (Financeiro): categoria nos lançamentos e índices de consulta por mês.
alter table public.lancamentos add column if not exists categoria text;
create index if not exists lancamentos_pago_em_idx on public.lancamentos (clinica_id, pago_em);
create index if not exists lancamentos_agendamento_idx on public.lancamentos (agendamento_id);
