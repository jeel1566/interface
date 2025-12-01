# n8n-interface Project Context

## Architecture Overview
- Microservices: FastAPI backend, React frontend, Celery workers, Redis queue
- MVP Goal: Single-operator automation platform (no auth yet)
- SaaS Goal: Multi-tenant, per-seat subscription model

## Technology Stack
**Backend:** Python 3.11+, FastAPI (async), Pydantic for validation
**Frontend:** React 18, Vite, TypeScript, React Query for async state
**Database:** Supabase (Postgres), Row-Level Security for future multi-tenancy
**Queue:** Redis, Celery (5.x)
**Auth (MVP):** None. (SaaS: Supabase Auth + JWT)
**Secrets:** Supabase Vault for API keys (AES-256 encryption)

## Coding Standards
- **Python:** PEP 8, type hints, async/await everywhere
- **React:** Functional components, hooks, TypeScript strict mode
- **API:** RESTful, auto-generated OpenAPI via FastAPI
- **Database:** Row-Level Security enabled on all tables
- **Error Handling:** Pydantic validation + custom exceptions

## Folder Structure
n8n-interface/
├── backend/
│ ├── main.py
│ ├── config.py
│ ├── api/v1/
│ │ ├── instances.py
│ │ ├── workflows.py
│ │ ├── executions.py
│ ├── models/
│ │ ├── schemas.py
│ │ ├── database.py
│ ├── services/
│ │ ├── n8n_service.py
│ │ ├── workflow_service.py
│ │ ├── vault_service.py
│ ├── workers/
│ │ ├── celery_app.py
│ │ ├── tasks.py
│ ├── requirements.txt
│ ├── Dockerfile
│ └── .env.example
├── frontend/
│ ├── src/
│ │ ├── main.tsx
│ │ ├── App.tsx
│ │ ├── components/
│ │ ├── hooks/
│ │ ├── types/
│ │ ├── utils/
│ ├── vite.config.ts
│ ├── tsconfig.json
│ ├── package.json
├── docker-compose.yml
└── README.md

## Security Principles (MVP)
- ✅ All n8n API keys → Supabase Vault (never in code/DB)
- ✅ Webhook callbacks require `x-webhook-secret` header
- ✅ Input validation via Pydantic on ALL endpoints
- ✅ HTTPS enforced (Render + Vercel provide SSL/TLS)
- ⚠️ No user authentication in MVP (acceptable for single-operator phase)

## What NOT to Do
- ❌ Store secrets as environment variables (use Vault)
- ❌ Use synchronous database queries (use async/await)
- ❌ Skip input validation (Pydantic mandatory)
- ❌ Commit `.env` files to Git
- ❌ Use SELECT * (always specify columns)
- ❌ Trust user input without validation
- ❌ Block on I/O in main thread (use Celery for long tasks)
