-- Logo da clínica: bucket público "marca" + leitura pública do nome/logo (tela de login e assinatura).
insert into storage.buckets (id, name, public)
values ('marca', 'marca', true)
on conflict (id) do update set public = true;

drop policy if exists marca_admin_insert on storage.objects;
drop policy if exists marca_admin_update on storage.objects;
drop policy if exists marca_admin_delete on storage.objects;
create policy marca_admin_insert on storage.objects for insert
  with check (bucket_id = 'marca' and (storage.foldername(name))[1] = public.get_clinica_id()::text
    and exists (select 1 from public.usuarios where id = auth.uid() and perfil = 'admin'));
create policy marca_admin_update on storage.objects for update
  using (bucket_id = 'marca' and (storage.foldername(name))[1] = public.get_clinica_id()::text
    and exists (select 1 from public.usuarios where id = auth.uid() and perfil = 'admin'));
create policy marca_admin_delete on storage.objects for delete
  using (bucket_id = 'marca' and (storage.foldername(name))[1] = public.get_clinica_id()::text
    and exists (select 1 from public.usuarios where id = auth.uid() and perfil = 'admin'));

-- Uma clínica por instalação: devolve nome e logo para telas sem login.
create or replace function public.marca_publica()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object('nome', nome, 'logo_url', logo_url) from clinicas order by criado_em limit 1
$$;
revoke all on function public.marca_publica() from public;
grant execute on function public.marca_publica() to anon, authenticated;
