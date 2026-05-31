# 🚀 Biishare API

API backend da plataforma **Biishare**, responsável por fornecer conteúdos educacionais e gerenciar dados utilizados pela aplicação frontend.

A API foi construída com **Express + TypeScript** e adaptada para execução serverless na Vercel através de um handler customizado.

---

## ✨ Funcionalidades

* 📚 Gestão de conteúdos (posts, vídeos, documentos)
* 🔎 Filtros por disciplina, nível e tipo de conteúdo
* 🧾 Validação de dados com Zod
* 🌐 API RESTful
* ⚡ Estrutura organizada e escalável

---

## 🛠️ Tecnologias

* Node.js
* Express
* TypeScript
* MongoDB + Mongoose
* Zod
* Dotenv
* Vercel Serverless Functions

---

## 📁 Estrutura do projeto

```bash
api/
 └── index.ts            # Entry point para Vercel (serverless handler)

src/
 ├── server/
 │    └── Server.ts      # Instância do Express
 ├── routes/             # Definição das rotas
 ├── controllers/        # Manipulação das requisições
 ├── services/           # Regras de negócio
 ├── models/             # Schemas do Mongoose
 ├── schemas/            # Validação com Zod
 └── utils/              # Funções auxiliares
```

---

## ⚙️ Como funciona (arquitetura)

A aplicação utiliza um servidor Express tradicional que é adaptado para o ambiente serverless da Vercel:

* O Express é criado em `src/server/Server.ts`
* O handler em `api/index.ts` converte requisições HTTP da Vercel
* O servidor é executado usando `http.createServer`

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env`:

```env
PORT=4000
MONGO_URI=
NODE_ENV=
```

---

## ⚙️ Como rodar localmente

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/api-biishare.git

# Entrar na pasta
cd api-biishare

# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run start
```

API disponível em:
👉 http://localhost:4000

---

## 🌐 Deploy

A API pode ser deployada na Vercel utilizando funções serverless através da pasta `api/`.

---

## 🧪 Scripts disponíveis

```bash
npm run start    # Desenvolvimento com nodemon
npm run build    # Compila TypeScript
```

---

## 🌐 Endpoints

```http
# ROOT
GET    /

# POSTS
GET    /posts
GET    /posts/filters
GET    /posts/:id
POST   /posts
PUT    /posts/:postId
DELETE /posts/:id

# TOQUES (CURIOSIDADES)
GET    /toques
GET    /toques/:id
POST   /toques

# ADS
GET    /ads
GET    /ads/:id
POST   /ads
```


---


---

## 📄 Licença

ISC
