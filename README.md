# Tesouraria Jovem

Sistema de gestão financeira para o departamento de jovens da igreja. Permite acompanhar campanhas de arrecadação, registrar contribuições e despesas, monitorar a adimplência dos membros e visualizar a saúde financeira do departamento.

---

## Funcionalidades

- **Painel de controle** com saldo atual, entradas e saídas do mês e atividades recentes
- **Campanhas** de mensalidade e arrecadação, com acompanhamento por membro e progresso em relação à meta
- **Contribuições por membro** com suporte a pagamentos parciais, múltiplos pagamentos e isenções com motivo registrado
- **Transações** — registro completo de entradas e saídas, vinculadas ou não a campanhas, incluindo doações externas e anônimas
- **Membros** — cadastro, edição e controle de status dos jovens do departamento
- **Análises (em breve)** — visão financeira completa com gráficos de desempenho, adimplência, isenções e categorias de receita
- **Autenticação** via Supabase Auth (em breve) — acesso restrito, sem cadastro público

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Banco de dados | PostgreSQL via Supabase |
| ORM | Prisma |
| Autenticação | Supabase Auth |
| Estilização | Tailwind CSS + shadcn/ui |
| Formulários | React Hook Form + Zod |
| Queries client | TanStack Query (React Query) |
| Gráficos | Recharts |

---

## Pré-requisitos

- Node.js 18+
- Uma conta no [Supabase](https://supabase.com) com um projeto criado

---

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/tesouraria-jovem.git
cd tesouraria-jovem
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_PUBLISHABLE_key

# Banco de dados (usado pelo Prisma)
DATABASE_URL=postgresql://postgres:[senha]@db.[projeto].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[senha]@db.[projeto].supabase.co:5432/postgres
```

> As chaves do Supabase estão disponíveis em **Project Settings → API** no dashboard.

### 4. Aplique as migrations

```bash
npx prisma migrate deploy
```

### 5. Popule o banco com dados iniciais (opcional)

```bash
npx prisma db seed
```

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Configuração do Supabase Auth

O sistema não possui cadastro público. Todos os usuários são criados manualmente pelo administrador.

### Criar um usuário

1. Acesse o dashboard do Supabase
2. Vá em **Authentication → Users**
3. Clique em **Add user → Create new user**
4. Informe o e-mail e a senha do usuário

### Desativar confirmação de e-mail

Para que o login funcione sem etapa de confirmação:

1. Vá em **Authentication → Settings**
2. Desative **Enable email confirmations**

---

## Estrutura do projeto

```
/app
  /login              → Página de autenticação
  /(dashboard)
    /                 → Painel de controle
    /analytics        → Página de análises (em breve)
    /campaigns        → Lista de campanhas
    /campaigns/[id]   → Detalhe de campanha
    /transactions     → Histórico de transações
    /members          → Gestão de membros

/components           → Componentes reutilizáveis
  /ui                 → Primitivos shadcn/ui (não editar diretamente)

/lib
  /db                 → Queries Prisma (única camada que acessa o banco)
  /actions            → Server Actions (mutations validadas com Zod)
  /queries            → Query keys e funções para TanStack Query
  /supabase           → Clientes Supabase (browser, server, middleware)

/prisma
  schema.prisma       → Schema do banco de dados
  seed.ts             → Dados iniciais para desenvolvimento
```

---

## Modelo de dados

```
Member ──< CampaignMember >── Campaign
Member ──< Transaction >── Campaign (opcional)
```

- **`Member`** — membros cadastrados no departamento
- **`Campaign`** — qualquer esforço de arrecadação (mensalidade ou campanha livre)
- **`CampaignMember`** — vínculo entre membro e campanha, com valor esperado e flag de isenção
- **`Transaction`** — fonte de verdade de todos os valores; status de pagamento é sempre derivado daqui
- **`Settings`** — configurações globais do departamento (singleton)

> O status de pagamento de cada membro (`PENDING`, `PARTIAL`, `PAID`, `EXEMPT`) nunca é armazenado — é sempre calculado em tempo de consulta a partir das transações.

---

## Regras de negócio importantes

| Regra | Onde é aplicada |
|---|---|
| Apenas uma campanha `MONTHLY_FEE` ativa por vez | Server action `createCampaignAction` |
| Membros não podem ser adicionados a campanhas `MONTHLY_FEE` após a criação | Server action `addMemberToCampaignAction` |
| Membro deve estar vinculado à campanha antes de contribuir para ela | Server action `createTransactionAction` |
| Isenção exige categoria e motivo escrito (mín. 10 caracteres) | Server action `setMemberExemptAction` + Zod |
| Contribuição sem vínculo de campanha entra no caixa geral | Regra de negócio — `campaignId` nullable |

---

## Scripts disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Inicia o build de produção
npm run lint         # Lint do projeto
npx prisma studio    # Interface visual do banco de dados
npx prisma migrate dev --name nome   # Nova migration
```

---

## Deploy

O projeto está pronto para deploy na [Vercel](https://vercel.com):

1. Conecte o repositório na Vercel
2. Adicione as variáveis de ambiente do `.env.local` nas configurações do projeto
3. A Vercel detecta Next.js automaticamente — nenhuma configuração adicional necessária

> Certifique-se de usar `migrate deploy` (não `migrate dev`) em ambiente de produção. Em pipelines de CI/CD, adicione `npx prisma migrate deploy` como etapa de build.

---

## Licença

Uso interno. Todos os direitos reservados.