-- Assinatura do termo por link (sem login) + registro de evidências.
alter table public.termos_consentimento
  add column if not exists token uuid unique default gen_random_uuid(),
  add column if not exists token_expira_em timestamptz default (now() + interval '7 days'),
  add column if not exists assinatura_png text,          -- data:image/png;base64,...
  add column if not exists assinado_via text check (assinado_via in ('presencial', 'link')),
  add column if not exists assinado_ip text,
  add column if not exists assinado_user_agent text;

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
