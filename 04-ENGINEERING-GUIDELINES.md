# Engineering guidelines — common industry practice for this build

These aren't specific to this project — they're the baseline conventions worth following so the
codebase stays maintainable once you're vibe-coding fast across multiple sessions/tools.

## 1. TypeScript

- `strict: true` in every `tsconfig.json`, no exceptions. Vibe-coded code drifts toward `any`
  fastest when strict mode is off.
- Shared types (field definitions, stage definitions, API request/response shapes) live in
  `packages/shared-types` and get imported, never redefined per app.
- Prefer `type` for unions/shapes used across boundaries (API payloads), `interface` for
  extendable object shapes (Mongoose doc interfaces).
- Validate all external input (API request bodies, env vars) with Zod at the boundary — don't
  trust a TS type alone to guarantee runtime shape, since TS types disappear at runtime.

## 2. Project/code structure

- Feature-based folders over type-based where it scales better: `features/tickets/`,
  `features/projects/` each containing their own components, hooks, and API calls — rather than
  a global `components/`, `hooks/`, `api/` split that gets unwieldy past a few features.
- One Mongoose model per file, colocated with its Zod validation schema.
- Route handlers stay thin — business logic (stage-change side effects, email rendering) lives
  in a `services/` layer, not inline in the Express route.

## 3. Git workflow

- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:` — makes it trivial to scan
  history later, especially useful when a lot of commits come from AI-assisted sessions.
- Branch per feature (`feat/form-builder`, `feat/stage-emails`), even solo — keeps `main`
  always deployable.
- Never commit `.env`, API keys, or the `projectSecret`/`CLOUDINARY_API_SECRET` values — use
  `.env.example` with placeholder keys.

## 4. API design conventions

- REST resource naming: plural nouns (`/tickets`, `/projects`), nested only one level deep
  (`/projects/:id/tickets`), avoid verbs in the path.
- Consistent error shape across every endpoint:
  ```json
  { "error": { "code": "INVALID_INPUT", "message": "Email is required" } }
  ```
- Consistent success shape for lists: `{ "data": [...], "meta": { "total": 42, "page": 1 } }` —
  don't return bare arrays once pagination is likely (ticket lists will need it fast).
- Version the public widget API path from day one (`/api/public/v1/...`) — you will change the
  widget's contract eventually, and old embedded widgets on client sites can't be force-upgraded
  instantly.

## 5. Security checklist (standard, not project-specific)

- Every public write endpoint (ticket submission) is rate-limited.
- Every public endpoint validates the `Origin` header against a known allowlist where one exists.
- Passwords hashed with bcrypt (cost factor 10-12), never stored or logged in plaintext.
- JWTs short-lived with a refresh flow, or at minimum a sane expiry (don't issue 1-year tokens).
- All user-supplied strings that get rendered in HTML (emails, dashboard) are escaped —
  stored XSS via a ticket's "message" field is the classic miss in systems exactly like this.
- Secrets only ever read from environment variables, never hardcoded, never returned by any API
  response (the `projectSecret` is shown once at creation and never again).

## 6. Testing strategy (right-sized for a solo/small build)

- Unit test the things with real logic: template token rendering, form-field validation against
  a project's schema, stage-transition rules. Skip unit-testing trivial CRUD.
- A handful of integration tests on the public API (`POST /tickets` with valid/invalid payloads,
  origin-check rejection) — this is the attack surface, so it's worth the coverage.
- Skip e2e/browser testing for v1 unless something breaks repeatedly; not worth the setup cost
  yet at this scale.

## 7. Logging & observability

- Structured logs (`pino` or similar) over `console.log` — at minimum, log every stage change
  and every email send/failure with the `ticketId` and `projectId` attached.
- Surface email send failures somewhere visible (even just a dashboard banner or a Slack
  webhook) — a silent Resend failure means an end-user never finds out their ticket moved.

## 8. Documentation

- One `README.md` per app (`api`, `dashboard`, `widget`) covering: how to run it locally, required
  env vars, and how it talks to the other apps.
- Keep the field-type catalog and stage-config token list (`{{ticketNumber}}`, etc.) documented
  in one place both the code and a human can reference — it's easy to silently break token
  rendering when refactoring.

## 9. Deployment basics (when you get there)

- Separate deploys for `api`, `dashboard`, and `widget` (the widget bundle especially should be
  served from a CDN with long cache headers + versioned filename, since it's embedded in
  third-party sites you don't control the reload timing of).
- `CORS_DASHBOARD_ORIGIN` locked to your actual dashboard domain in production — never `*`.
- Run a MongoDB index on `Ticket.projectId`, `Ticket.statusToken` (unique), and
  `Project.projectKey` (unique) from day one — these are your hottest lookup paths.
