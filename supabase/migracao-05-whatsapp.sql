-- Sprint 5 (WhatsApp por links prontos): registro de envios e um modelo por tipo.
alter table public.whatsapp_mensagens
  add column if not exists tipo text,
  add column if not exists referencia_id uuid;   -- agendamento, lançamento etc.
alter table public.whatsapp_mensagens alter column numero_destino drop not null;
create index if not exists whatsapp_mensagens_ref_idx on public.whatsapp_mensagens (clinica_id, tipo, referencia_id);
create index if not exists whatsapp_mensagens_cliente_idx on public.whatsapp_mensagens (clinica_id, tipo, cliente_id, criado_em);
create unique index if not exists whatsapp_templates_tipo_uidx on public.whatsapp_templates (clinica_id, tipo);
