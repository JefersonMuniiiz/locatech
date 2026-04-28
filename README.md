# 🏗️ LocaTech – SaaS para Gestão de Locadoras de Equipamentos

MVP completo de sistema web para locadoras controlarem equipamentos, clientes, locações, financeiro e entregas.

---

## 📦 Estrutura do Projeto

```
locatech/
├── backend/          # Node.js + Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       ├── services/
│       └── server.js
└── frontend/         # React + Vite + Tailwind
    └── src/
        ├── components/
        ├── context/
        ├── pages/
        ├── services/
        └── utils/
```

---

## 🚀 Rodando Localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

---

### 1. Banco de Dados

Crie o banco de dados no PostgreSQL:
```sql
CREATE DATABASE locatech;
```

---

### 2. Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com sua DATABASE_URL e JWT_SECRET

# Gerar o cliente Prisma
npm run db:generate

# Executar migrations
npm run db:migrate

# Popular com dados iniciais
npm run db:seed

# Iniciar servidor de desenvolvimento
npm run dev
```

A API estará disponível em: `http://localhost:3001`

**Credenciais de teste após seed:**
- Email: `admin@locatech.com.br`
- Senha: `admin123`

---

### 3. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O app estará disponível em: `http://localhost:5173`

---

## 🔌 API Endpoints

### Autenticação
| Método | Rota              | Descrição          |
|--------|-------------------|--------------------|
| POST   | /api/auth/register | Cadastrar empresa  |
| POST   | /api/auth/login    | Login              |
| GET    | /api/auth/me       | Perfil do usuário  |

### Dashboard
| Método | Rota            | Descrição         |
|--------|-----------------|-------------------|
| GET    | /api/dashboard  | Estatísticas gerais|

### Equipamentos
| Método | Rota                  | Descrição             |
|--------|-----------------------|-----------------------|
| GET    | /api/equipments       | Listar equipamentos   |
| POST   | /api/equipments       | Criar equipamento     |
| GET    | /api/equipments/:id   | Buscar por ID         |
| PUT    | /api/equipments/:id   | Atualizar             |
| DELETE | /api/equipments/:id   | Remover               |

### Clientes
| Método | Rota              | Descrição         |
|--------|-------------------|-------------------|
| GET    | /api/clients      | Listar clientes   |
| POST   | /api/clients      | Criar cliente     |
| GET    | /api/clients/:id  | Buscar por ID     |
| PUT    | /api/clients/:id  | Atualizar         |
| DELETE | /api/clients/:id  | Remover           |

### Locações
| Método | Rota                           | Descrição               |
|--------|--------------------------------|-------------------------|
| GET    | /api/rentals                   | Listar locações         |
| POST   | /api/rentals                   | Criar locação           |
| GET    | /api/rentals/:id               | Buscar por ID           |
| PATCH  | /api/rentals/:id/complete      | Finalizar locação       |
| PATCH  | /api/rentals/:id/payment       | Atualizar pagamento     |
| GET    | /api/rentals/deliveries/today  | Entregas do dia         |

---

## ☁️ Deploy em Produção

### Opção Recomendada: Railway (Backend + DB) + Vercel (Frontend)

#### Backend no Railway
1. Acesse [railway.app](https://railway.app) e crie um projeto
2. Adicione um serviço **PostgreSQL** — anote a `DATABASE_URL`
3. Faça deploy do backend via GitHub ou CLI:
   ```bash
   npm install -g @railway/cli
   cd backend
   railway login
   railway up
   ```
4. Configure as variáveis de ambiente no painel Railway:
   ```
   DATABASE_URL=<gerado pelo Railway>
   JWT_SECRET=<chave-aleatoria-forte-32-chars>
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   FRONTEND_URL=https://seu-app.vercel.app
   FINE_RATE_PER_DAY=50
   ```
5. Após deploy, execute as migrations:
   ```bash
   railway run npm run db:migrate
   railway run npm run db:seed
   ```

#### Frontend na Vercel
1. Acesse [vercel.com](https://vercel.com) e importe o repositório
2. Configure o **Root Directory** como `frontend`
3. Adicione a variável de ambiente:
   ```
   VITE_API_URL=https://seu-backend.railway.app
   ```
4. No `vite.config.js`, ajuste o proxy para usar `VITE_API_URL` em produção, ou configure `src/services/api.js`:
   ```js
   baseURL: import.meta.env.VITE_API_URL || '/api'
   ```
5. Clique em Deploy ✅

---

### Opção Alternativa: VPS com Docker

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/locatech

# Configure os .env em backend/
cp backend/.env.example backend/.env

# Suba com Docker Compose
docker-compose up -d

# Execute seed
docker-compose exec backend npm run db:seed
```

---

## 🔒 Segurança

- Autenticação JWT com expiração configurável
- Multi-tenant: todos os dados são filtrados por `companyId`
- Senhas hasheadas com bcrypt (salt rounds: 12)
- CORS configurado por domínio
- Middleware de autenticação em todas as rotas privadas

---

## ⚙️ Variáveis de Ambiente

### Backend (`.env`)
| Variável           | Descrição                          | Exemplo                        |
|--------------------|------------------------------------|--------------------------------|
| `DATABASE_URL`     | String de conexão PostgreSQL       | `postgresql://user:pw@host/db` |
| `JWT_SECRET`       | Chave secreta para JWT             | `minha-chave-super-secreta`    |
| `JWT_EXPIRES_IN`   | Expiração do token                 | `7d`                           |
| `PORT`             | Porta do servidor                  | `3001`                         |
| `FRONTEND_URL`     | URL do frontend (para CORS)        | `http://localhost:5173`        |
| `FINE_RATE_PER_DAY`| Valor da multa por dia de atraso   | `50`                           |

---

## 🧱 Stack

| Camada     | Tecnologia              |
|------------|-------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS |
| State      | TanStack Query v5       |
| Routing    | React Router v6         |
| Backend    | Node.js + Express       |
| ORM        | Prisma                  |
| Banco      | PostgreSQL               |
| Auth       | JWT + bcryptjs          |

---

## 📌 Próximos Passos (Roadmap)

- [ ] Relatórios em PDF
- [ ] Notificações por WhatsApp (Z-API)
- [ ] Gestão de frota / motoristas
- [ ] App mobile (React Native)
- [ ] Multi-usuário por empresa
- [ ] Integração com boleto (Asaas/Pagar.me)
