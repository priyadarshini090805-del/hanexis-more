# Harnexis Cognitive Social Outreach Platform

Harnexis is an enterprise cognitive-AI customer acquisition and social media outreach campaign orchestrator built in standard React, Vite, Express, TypeScript, and Prisma.

---

## 🏗️ 1. Technical Architecture Overview

The backend is structured under clean clean patterns designed for rapid, performant, and reliable execution:
* **Presentation & Ingress Routing**: Express router system mapping all REST resource endpoints securely under `/api/*`.
* **Middlewares Layer**: Cryptographic verification guards (`authenticateJWT`, RBAC `requireRole`), rate limiters (`rateLimiter`), data encoders, and security compliance wrappers (`helmet`, `cors`).
* **Validation Layer**: Zod schema bounds matching and sanitizing incoming customer contexts on registration or logins.
* **Services Layer**: Pure cognitive interfaces (e.g. `AIService` supporting Gemini API logic, `LeadService`, `CampaignService`).
* **Relational Database Model (ORM)**: Prisma coupled with PostgreSQL schema containing synchronized models for teammate accounts, CRM targets, notifications, and campaigns.
* **Background Task Worker Queues**: BullMQ worker loop matching queues with optional Redis backing cache.

---

## 🛠️ 2. Rapid Local Installation & Configuration

### Prerequisite Setup
* Node.js v20+
* PostgreSQL DB Instance
* Redis Server (for BullMQ, handled automatically with mock fallbacks if Redis is absent)

### 1. Retrieve Packages
```bash
npm install
```

### 2. Configure Environment Secrets
Create a `.env` file from the provided template:
```bash
cp .env.example .env
```
Supply your credentials:
```env
GEMINI_API_KEY="AIzaSy..." # Your active Google Gemini key
DATABASE_URL="postgresql://postgres:password@localhost:5432/harnexis_db"
REDIS_URL="redis://localhost:6379"
```

### 3. Generate Schema Models
```bash
npx prisma generate
npx prisma db push
```

### 4. Direct Dev Boot
```bash
npm run dev
```
The server will boot securely at `http://localhost:3000`.

---

## 🐳 3. Containerized Releases using Docker Compose

Run the entire suite (PostgreSQL cluster, Redis thread pools, and the Express full-stack web service) with a single command:

```bash
docker-compose up --build
```

This registers container endpoints securely:
* **Web Portal Interface**: `http://localhost:3000`
* **PostgreSQL Database Storage**: `localhost:5432`
* **Redis Cache Buffer**: `localhost:6379`

---

## 🤖 4. Developer Verification Account

To quickly look around or query endpoints without standard registration, log in using the fallback administrator profile credentials:
* **Teammate Email**: `dev@harnexis.io`
* **Secret Key**: `harnexis2026`
