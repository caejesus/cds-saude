# Instalar o sistema para uma clínica nova

Cada clínica tem **o próprio banco (Supabase)** e **o próprio endereço (Vercel)**,
com nome, logo e cores dela. O código é o mesmo para todas: uma correção feita aqui
chega a todos os clientes no próximo deploy.

## 1. Banco de dados (Supabase)

1. Crie uma conta Supabase **com o email da clínica** (ou um email seu só para ela).
   Plano grátis: até 2 projetos por conta e pausa após 7 dias sem uso.
   Para cliente pagante, use o **Pro (US$ 25/mês)** e inclua no preço da mensalidade.
2. **New project**, região **South America (São Paulo)**.
3. **SQL Editor**: cole todo o `supabase/schema.sql` e rode.
4. **Authentication > Sign In / Providers**: desligue **Allow new users to sign up**.
5. **Authentication > Users > Add user**: email e senha provisória do dono da clínica,
   marcando **Auto Confirm User**.
6. **SQL Editor**:

```sql
select public.instalar_clinica(
  'dono@clinica.com',   -- email do passo 5
  'Clínica Sorriso',    -- nome da clínica
  'odonto',             -- odonto | estetica | geral
  'Dra. Ana Souza'      -- nome do administrador
);
```

7. **Project Settings > API Keys**: copie a URL e a **publishable key**.

## 2. Site (Vercel)

1. Vercel > **Add New > Project** > importe `caejesus/cds-saude`.
2. Nome do projeto: o da clínica (ex.: `clinica-sorriso`).
3. Em **Environment Variables**, preencha as variáveis do `.env.example`
   (Supabase da clínica, nome, logo, cores e seu WhatsApp de suporte).
4. **Deploy**. Opcional: domínio próprio em Settings > Domains
   (ex.: `sistema.clinicasorriso.com.br`).

Logo: coloque o arquivo em `public/logos/clinica-sorriso.png` e use
`NEXT_PUBLIC_MARCA_LOGO=/logos/clinica-sorriso.png`, ou use a URL de uma imagem.

## 3. Entrega

- [ ] Login do dono funcionando no endereço da clínica
- [ ] Menu certo para o tipo (odonto: Tratamentos; estética: Pacotes)
- [ ] Logo e cores conferidos no celular e no computador
- [ ] Senha provisória entregue e trocada pelo cliente
- [ ] Contrato de instalação + mensalidade assinado

## Atualizar todos os clientes

Faça push na branch `main`. Todos os projetos da Vercel ligados ao repositório
fazem o deploy sozinhos. Mudanças de banco ficam em `supabase/migracao-XX-*.sql`
e precisam ser rodadas no SQL Editor de cada cliente.
