# Sergio Drywall OS

Production-grade drywall contractor operating system for estimating, jobs, invoices, expenses, materials, crew tracking, QR codes, PDFs, multilingual workflows, and operator administration.

The full Next.js application is inside:

```text
drywall-os/
```

## Quick Start

```bash
cd drywall-os
npm install
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Open:

```text
http://localhost:3000/en/register
```

## Deployment Note

When deploying to Vercel, Render, Railway, or another host, set the project/root directory to:

```text
drywall-os
```

The app needs PostgreSQL, Redis, and the environment variables listed in `drywall-os/.env.example`.
