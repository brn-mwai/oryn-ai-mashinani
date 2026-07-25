# Team

Oryn's entry into **AI Mashinani 2026**.

## Members

| Member | GitHub | Focus |
|--------|--------|-------|
| Brian Mwai | [@brn-mwai](https://github.com/brn-mwai) | Architecture, agent runtime, Arc/USDC settlement |
| Mathew Rym | [@Mathew-Rym](https://github.com/Mathew-Rym) | Frontend, landing page, demo experience |
| Abdikhafar | [@Abdikhafar-hub](https://github.com/Abdikhafar-hub) | Agent reasoning, AI/ML, security hardening |
| Yusuf | [@Yusuf-cm](https://github.com/Yusuf-cm) | Payments, invoicing flows, integration tests |
| Joseph Wakaro | [@josephwakaro](https://github.com/josephwakaro) | Convex data layer, seeding, analytics |

## Getting started

```bash
gh repo clone brn-mwai/oryn-ai-mashinani
cd oryn-ai-mashinani
pnpm install
cp .env.example .env.local   # ask Brian for the shared keys
pnpm dev
```

Stack: Next.js 15 (App Router), Convex, Clerk, Circle Arc + USDC, Inngest, Tailwind.

## How we work

Branch off `main` as `feat/<area>-<short-desc>`, open a PR, one review before merge. Each member owns the area listed above; open an issue before starting anything outside it so we do not collide.

## Where to look first

| Area | Path |
|------|------|
| Landing + marketing | `app/_components/`, `lib/oryn-content.ts` |
| Dashboard | `apps/web/app/dashboard/` |
| Backend + schema | `convex/` |
| Shared UI | `components/`, `common/` |
