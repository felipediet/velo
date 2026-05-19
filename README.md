
# Curso Automatizai

[Automatizai] (https://fernandopapito.com/automatizai)

---

## Instalação

Na pasta do projeto (`velo`):

```bash
yarn install
```

### Variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto com os dados do projeto no Supabase (**Project Settings → API** ou **Connect** no dashboard):

```env
VITE_SUPABASE_PROJECT_ID="seu_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_chave_anon_publica"
VITE_SUPABASE_URL="https://seu_project_id.supabase.co"
```

### Rodar em desenvolvimento

```bash
yarn dev
```

Acesse: `http://localhost:5173`

---

## Configuração do Supabase

### 1. Criar Projeto

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Escolha um nome e senha para o banco
4. Aguarde a criação (~2 minutos)

### 2. Variáveis de Ambiente

As mesmas do passo [Variáveis de ambiente](#variáveis-de-ambiente) acima.

### 3. Deploy (banco + functions)

```bash
# Instalar CLI
npm install -g supabase
yarn add supabase -D

# Login e vincular projeto
yarn supabase login
yarn supabase link --project-ref SEU_PROJECT_ID

# Aplicar migrações (cria tabelas e RLS)
yarn supabase db push

# Deploy das Edge Functions
yarn supabase functions deploy
```

## Testes E2E (Playwright)

```bash
yarn playwright test
# Modo interativo (UI)
yarn playwright test --ui
# Só Chromium
yarn playwright test --project=chromium
# Arquivo específico
yarn playwright test example
# Por título do cenário
yarn playwright test -g 'webapp deve estar online'
# Debug
yarn playwright test --debug
yarn playwright test --debug -g 'webapp deve estar online'
# Gerar testes com Codegen
yarn playwright codegen
```




# Velô Sprint - Configurador de Veículo Elétrico

Aplicação web em React para configuração e compra do veículo elétrico **Velô Sprint**.

## Sobre o Projeto

Uma SPA (Single Page Application) que permite:
- Personalizar cores, rodas e opcionais do veículo
- Calcular preços em tempo real
- Realizar pedidos com análise de crédito
- Consultar status de pedidos

**Especificações do Velô Sprint:** 450 km de autonomia | 0-100 km/h em 3.2s | 500 cv

---

## Stack Tecnológica

| Categoria | Tecnologias |
|-----------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Estado** | Zustand (global), React Hook Form (formulários) |
| **Validação** | Zod |
| **Data Fetching** | TanStack Query |
| **Backend** | Supabase (PostgreSQL + Edge Functions) |

---

## Instalação

```bash
# Instalar dependências
yarn install

# Rodar em desenvolvimento
yarn dev
```

Acesse: `http://localhost:5173`

---

## Configuração do Supabase

### 1. Criar Projeto

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Escolha um nome e senha para o banco
4. Aguarde a criação (~2 minutos)

### 2. Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_PROJECT_ID="seu_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_chave_anon_publica"
VITE_SUPABASE_URL="https://seu_project_id.supabase.co"
```

> Encontre essas informações em: **Project Settings → API**

### 3. Deploy (banco + functions)

```bash
# Instalar CLI
npm install -g supabase
yarn add supabase -D

# Login e vincular projeto
yarn supabase login
yarn supabase link --project-ref SEU_PROJECT_ID
yarn supabase link --project-ref cmfyjqikzaxhfppgbqrh

# Aplicar migrações (cria tabelas e RLS)
yarn supabase db push

# Deploy das Edge Functions
yarn supabase functions deploy
```

Pronto! O banco e as functions estarão configurados.

---

## Estrutura Principal

```
src/
├── pages/           # Páginas da aplicação
├── components/      # Componentes React
│   ├── configurator/   # Configurador do carro
│   ├── landing/        # Landing page
│   └── ui/             # Componentes shadcn/ui
├── store/           # Estado global (Zustand)
├── hooks/           # Hooks customizados
└── integrations/    # Cliente Supabase
```

---

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/configure` | Configurador do veículo |
| `/order` | Checkout/Pedido |
| `/success` | Confirmação do pedido |
| `/lookup` | Consulta de pedidos |

---

## Modelo de Preços

- **Preço base:** R$ 40.000
- **Rodas Sport:** +R$ 2.000
- **Precision Park:** +R$ 5.500
- **Flux Capacitor:** +R$ 5.000
- **Financiamento:** 12x com juros de 2% a.m.

---

## Banco de Dados

**Tabela `orders`** — campos principais:
- `order_number` — Formato: VLO-XXXXXX
- `color`, `wheel_type`, `optionals` — Configuração
- `customer_name`, `customer_email`, `customer_cpf` — Cliente
- `payment_method`, `total_price` — Pagamento
- `status` — pending, approved, rejected, analysis

---

## Análise de Crédito

| Score | Resultado |
|-------|-----------|
| > 700 | Aprovado |
| 501-700 | Em análise |
| ≤ 500 | Reprovado |

*Se entrada ≥ 50% do total, aprova mesmo com score < 700*

---

## Fluxo Principal

```
Landing → Configurador → Checkout → Análise de Crédito → Confirmação
```

---

## Scripts

```bash
npm run dev      # Desenvolvimento
npm run build    # Build de produção
npm run lint     # Verificar código
```

---

## Teste E2E com Docker + Playwright

Use o script PowerShell `run-docker-playwright.ps1` para validar o fluxo completo:
- build da imagem Docker
- subida do container
- verificação de disponibilidade da aplicação
- execução dos testes Playwright
- limpeza automática do container ao final

### Execução básica

No PowerShell, dentro da pasta do projeto:

```powershell
.\run-docker-playwright.ps1
```

### Opções úteis

```powershell
# Pula instalação de dependências/browsers
.\run-docker-playwright.ps1 -SkipInstall

# Mantém o container após os testes
.\run-docker-playwright.ps1 -KeepContainer

# Abre relatório HTML ao final
.\run-docker-playwright.ps1 -ShowReport

# Personaliza porta e tempo máximo de espera da aplicação
.\run-docker-playwright.ps1 -Port 5173 -MaxWaitSeconds 120
```