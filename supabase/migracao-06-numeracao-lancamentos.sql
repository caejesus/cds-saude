-- Numeração sequencial dos lançamentos (ordem de criação) e quem criou.
alter table public.lancamentos add column if not exists numero bigint;
alter table public.lancamentos add column if not exists criado_por uuid references public.usuarios(id) on delete set null default auth.uid();

-- Numera o que já existe pela data de criação.
with ordem as (
  select id, row_number() over (order by criado_em, id) as n from public.lancamentos where numero is null
)
update public.lancamentos l
   set numero = o.n + coalesce((select max(numero) from public.lancamentos), 0)
  from ordem o where o.id = l.id;

create sequence if not exists public.lancamentos_numero_seq owned by public.lancamentos.numero;
select setval('public.lancamentos_numero_seq', greatest(coalesce((select max(numero) from public.lancamentos), 0), 1), (select count(*) > 0 from public.lancamentos));
alter table public.lancamentos alter column numero set default nextval('public.lancamentos_numero_seq');
alter table public.lancamentos alter column numero set not null;
create unique index if not exists lancamentos_numero_uidx on public.lancamentos (numero);
