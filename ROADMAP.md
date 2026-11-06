# CDS Gestão em Saúde: próximos upgrades

Lista viva de melhorias aprovadas. Marque `[x]` quando entregar e mova para "Entregue".

## Prioridade alta (diferencial de venda)

- [ ] **Perfis de acesso e logins da equipe**
  - Administrador (tudo), Recepção (agenda, clientes, receber, pacotes, WhatsApp; sem relatórios financeiros, prontuário e configurações), Profissional (só a própria agenda e os próprios clientes, com prontuário, fotos e termos).
  - Configurações → Usuários: convite por email (a pessoa cria a senha), vincular login ao profissional, desativar acesso.
  - Restrições aplicadas também no banco (RLS por perfil), não só na tela.
  - Requer `SUPABASE_SERVICE_ROLE_KEY` na Vercel (somente servidor).

- [ ] **Painel do profissional**
  - Tela inicial "Seus atendimentos de hoje".
  - Antes de atender: resumo do cliente (sessão X de Y do pacote, alergias, última anotação do prontuário).
  - Acesso rápido a prontuário, fotos e termo.

- [ ] **Comissão dos profissionais**
  - Percentual ou valor fixo por profissional e/ou por procedimento.
  - Cálculo automático pelos atendimentos concluídos e pagos (inclusive sessões de pacote).
  - Painel do profissional: "Este mês: N atendimentos, R$ X de comissão".
  - Relatório de fechamento de comissões em PDF (padrão planilha) para o administrador.

- [ ] **Agendamento online pelo cliente**
  - Link público da clínica (para Instagram/WhatsApp): escolhe procedimento, profissional e horário livre.
  - Entra na agenda como "aguardando confirmação", e a recepção aprova ou recusa.
  - Configurar horários de funcionamento e intervalos por profissional.

- [ ] **Avaliação pós-atendimento**
  - Link enviado depois do atendimento (aba Pós-atendimento do WhatsApp), com nota de 1 a 5 e comentário.
  - Nota 5: sugerir avaliar a clínica no Google (link configurável).
  - Painel de avaliações por profissional e procedimento.

## Melhorias de uso

- [x] **Horários livres no agendamento**: ao escolher profissional e data, mostrar o dia dele (ocupado: quem, o quê, de que horas a que horas; livre: botões com os horários onde cabe a duração do procedimento).
  - Padrão decidido: 08:00 às 18:00. Depois, horário por clínica e por profissional em Configurações.

- [x] Atalhos de **Foto** e **Termo** no topo da ficha do cliente e no menu "…" da agenda.
- [x] Upload da **logo da clínica** em Configurações (hoje só por variável de ambiente).
- [x] **Dashboard** com alertas (+ relógio e clima): lembretes pendentes de amanhã, aniversariantes, cobranças vencidas, pacotes vencendo.

## Novos módulos e evoluções

- [ ] **Módulo odontologia**: odontograma clicável e plano de tratamento/orçamento que gera parcelas no financeiro.
- [ ] **WhatsApp automático** (futuro): lembretes e confirmações pelo servidor. Opções avaliadas:
  - API oficial da Meta: utilidade ~R$ 0,035/mensagem (grátis na janela de 24h); marketing ~R$ 0,32.
  - Evolution API: VPS ~R$ 39/mês (Hostinger KVM 2), sem custo por mensagem, risco de bloqueio.

## Entregue

- [x] Núcleo: login fechado, white-label por instalação, fuso horário
- [x] Números com algarismos alinhados e fixos na fonte dos títulos (Cormorant)
- [x] Agenda, clientes, prontuário, configurações
- [x] Financeiro: lançamentos numerados, parcelas, caixa do dia, PDFs em planilha, recibos em 2 vias
- [x] Estética: pacotes com saldo, fotos antes/depois, termo com assinatura (tablet, link de 48h, impresso)
- [x] Central de WhatsApp por links prontos: confirmações, pós-atendimento, aniversários, cobranças, modelos
