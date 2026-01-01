# AGENTS.md

## Project Goal
Deliver the Vietnamese Heritage Museum (VHM) Memorial System as a production-ready web application, starting from an empty environment. The system memorializes Vietnamese boat people; ensure all user-facing content is respectful and culturally sensitive.

## Canonical Stack
- Backend: Node.js 18+ (TypeScript), Express, Prisma, PostgreSQL, Redis, Elasticsearch
- Frontend: React 18 (TypeScript), MUI v5, Redux Toolkit + RTK Query, React Router v6, Vite
- Infra: Docker, docker-compose, optional Kubernetes/Helm, NGINX

## Ground Rules
- Use TypeScript everywhere.
- Keep APIs versioned under `/api/v1`.
- Prefer small, composable modules with clear ownership (routes -> services -> data access).
- Enforce security baseline: helmet, rate limits, input validation, CSRF strategy, safe CORS.
- Treat all memorial content with cultural sensitivity.

## Phase 0 - Environment & Bootstrapping
1) Install prerequisites: Node.js 18+, Docker Desktop, Git.
2) Clone repository.
3) Run `npm run setup` (installs root, backend, frontend, shared deps).
4) Copy env files:
   - `cp .env.example .env`
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.example frontend/.env`
5) Start baseline services with Docker:
   - `docker-compose up -d`
6) Validate:
   - API health: `GET http://localhost:8000/health`
   - Frontend: `http://localhost:3000`

## Phase 1 - Core Backend (API + Database)
Goal: CRUD for persons, auth, and core memorial features.

1) Database schema
   - Implement Prisma schema for users, persons, memorials, contributions, audit logs, and supporting entities.
   - Use UUID/CUID primary keys consistently.
   - Add indexes for search filters (name, dates, locations).

2) Auth
   - Implement secure email/password flow (hashing + verification).
   - OAuth flows (Google/Facebook) with real token exchange and state validation.
   - Session storage (Redis) + JWT for API auth.

3) Core APIs
   - `/persons`: CRUD with validation and pagination
   - `/memorials`: remembrances, offerings, reminders
   - `/search`: faceted search (Elasticsearch optional in MVP)
   - `/users`: profile, favorites, contributions
   - `/admin`: moderation and audit logs

4) Observability
   - Structured logging
   - Global error handler with safe messages
   - Health + readiness endpoints

## Phase 2 - Core Frontend
Goal: functional UI for search, person details, memorial interactions, auth flows.

1) Routes
   - Home, Search, Person Detail, Memorial
   - Auth: Login, Register, Profile
   - Admin: Dashboard + moderation pages

2) State Management
   - Redux slices for auth, persons, search, UI
   - Token storage with expiration handling
   - Protected routes (role-aware)

3) UX
   - Search experience with suggestions
   - Person profile with timeline, photos, and family relationships
   - Memorial actions (offerings, remembrances, reminders)

## Phase 3 - Search & Performance
1) Elasticsearch integration with person indexing
2) Faceted search + autocomplete suggestions
3) Caching of popular queries (Redis)
4) API response time targets: <300ms average

## Phase 4 - Admin + Moderation
1) Admin dashboard for submissions and content approval
2) Audit logs for admin actions
3) Moderation queues for remembrances and user submissions

## Phase 5 - Production Readiness
1) Security hardening
   - Rate limits on auth/search
   - Validation on every endpoint
   - Content security policy
   - CSRF strategy for cookie-based auth
2) CI/CD
   - Lint, typecheck, unit tests
   - Build pipeline for frontend/backend
3) Deployment
   - Docker builds and environment-specific configs
   - Optional Kubernetes/Helm manifests

## Testing Requirements
- Unit tests for services and reducers
- Integration tests for API routes
- End-to-end tests for core user journeys

## Definition of Done (High-Level)
- Users can search, view, and remember persons
- Users can authenticate and manage profiles
- Admins can review and approve submissions
- App runs in Docker with documented setup
- Test suite passes with acceptable coverage
