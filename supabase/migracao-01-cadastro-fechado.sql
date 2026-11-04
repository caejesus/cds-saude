-- Só para bancos criados antes desta versão (ex.: o de demonstração).
-- Cadastro fechado: só o dono do sistema instala clínicas (pelo SQL Editor).
revoke execute on function public.criar_clinica(text, text, text) from public, anon, authenticated;
drop function if exists public.criar_clinica(text, text, text);

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
