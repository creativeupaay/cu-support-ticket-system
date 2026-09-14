# Technical implementation — Centralized Support Ticket System

## 1. Stack

- **Language**: TypeScript everywhere (backend, dashboard, widget, shared types package)
- **Backend**: Node.js + Express + Mongoose (MongoDB)
- **Validation**: Zod (shared schemas between backend routes and frontend forms where possible)
- **Auth**: JWT for agents (`jsonwebtoken` + `bcrypt` for password hashing)
- **Email**: Resend (`resend` npm package) — transactional templates for ticket-received and
  stage-change notifications
- **File uploads**: Cloudinary — **unsigned/signed direct upload from the browser**, so photo
  bytes never pass through your API server
- **Dashboard frontend**: React + Vite + TypeScript + Tailwind CSS, TanStack Query for
  server-state, React Router
- **Widget frontend**: React + Vite, built as a single IIFE bundle, mounted inside an `<iframe>`
- **Rate limiting**: `express-rate-limit` + Redis (or in-memory store for MVP, swap later)

## 2. Monorepo layout

```
support-hub/
  apps/
    api/                 # Express + TS backend
    dashboard/            # Agent dashboard (React + Vite + Tailwind)
    widget/               # Embeddable widget (React + Vite, builds to widget.js)
  packages/
    shared-types/         # Zod schemas + inferred TS types, shared by all apps
  package.json             # workspaces root
```

Use npm/pnpm workspaces so `shared-types` (field types, stage types, API request/response
shapes) is a single source of truth consumed by `api`, `dashboard`, and `widget`.

## 3. Core data model

```ts
// packages/shared-types/src/index.ts

export type FieldType = 'text' | 'email' | 'textarea' | 'dropdown' | 'file' | 'checkbox' | 'radio';

export interface FormFieldDefinition {
  id: string;            // slug, e.g. "full_name" — stable key used in formResponses
  label: string;         // "Full name"
  type: FieldType;
  required: boolean;
  order: number;
  placeholder?: string;
  options?: string[];    // required for 'dropdown' and 'radio'
}

export interface StageDefinition {
  id: string;             // slug, e.g. "in_progress"
  name: string;           // "In progress"
  color: string;          // hex, used for badges in dashboard + widget status page
  order: number;
  isDefault: boolean;     // true for exactly one stage — where new tickets land
  isTerminal: boolean;    // reporting flag, e.g. Resolved/Closed
  emailTemplate: {
    subject: string;      // supports {{ticketNumber}}, {{stageName}}, {{statusUrl}}
    body: string;         // same tokens, plus {{field.<fieldId>}} for submitted values
  };
}

export interface Project {
  _id: string;
  organizationId: string;
  name: string;
  projectKey: string;         // public, embedded in widget script tag
  projectSecretHash: string;  // bcrypt hash — never returned by any API after creation
  allowedDomains: string[];   // origin allowlist
  formFields: FormFieldDefinition[];
  stages: StageDefinition[];
  createdAt: string;
}

export interface Ticket {
  _id: string;
  projectId: string;
  ticketNumber: string;                        // e.g. "SUPP-1042", generated per-project counter
  currentStageId: string;
  formResponses: Record<string, string | string[]>; // fieldId -> value; file fields hold Cloudinary URLs
  requesterEmail: string;
  statusToken: string;                          // random, unguessable — grants access to status page
  stageHistory: { stageId: string; changedAt: string; changedBy?: string }[];
  internalNotes: { body: string; authorId: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  _id: string;
  organizationId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'owner' | 'admin' | 'agent';
}
```

**Tenant isolation rule**: every Mongoose query for `Ticket` and `Project` must filter by
`organizationId` (agent side) or `projectId` (public side) — never trust a bare `_id` lookup
without also matching the scoping field pulled from the authenticated context.

## 4. API surface

### Agent-facing (JWT auth, `Authorization: Bearer <token>`)

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Email/password → JWT |
| POST | `/api/projects` | Create project (fields + stages + domains) |
| GET | `/api/projects` | List projects in the org |
| GET | `/api/projects/:id` | Get one project's full config |
| PATCH | `/api/projects/:id` | Update form fields / stages / domains |
| GET | `/api/projects/:id/tickets` | List tickets (filter by stage, search) |
| GET | `/api/tickets/:id` | Ticket detail |
| PATCH | `/api/tickets/:id/stage` | Change stage → triggers email |
| POST | `/api/tickets/:id/notes` | Add internal note (not emailed) |

### Public/widget-facing (auth via `projectKey` + origin check)

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/public/projects/:projectKey/schema` | Widget fetches form fields to render |
| POST | `/api/public/projects/:projectKey/upload-signature` | Get a signed Cloudinary upload payload |
| POST | `/api/public/projects/:projectKey/tickets` | Submit a new ticket |
| GET | `/api/public/status/:statusToken` | End-user status page data (read-only) |

**Origin check middleware**: on every public route, verify the `Origin`/`Referer` header
against `project.allowedDomains`. Reject with 403 if it doesn't match — this is what stops
someone from lifting a `projectKey` and using it from an unauthorized site.

## 5. Widget architecture

```html
<script src="https://cdn.yoursupporthub.com/widget.js" data-project-key="proj_live_abc123" async></script>
```

1. `widget.js` (small vanilla-JS loader, not the full React bundle) injects a floating button
   and, on click, an `<iframe src="https://widget.yoursupporthub.com/?key=proj_live_abc123">`.
2. The iframe app (React) calls `GET /schema` to fetch `formFields`, renders the form
   dynamically by mapping `FieldType → input component`.
3. On submit: for a `file` field, first request an upload signature, upload directly to
   Cloudinary from the browser, then submit the ticket with the returned Cloudinary URL in
   `formResponses`.
4. On success, show a confirmation screen with "check your email for updates."

Iframe isolation means the widget's Tailwind styles never leak into or clash with the host
page's CSS — this is non-negotiable for an embeddable widget.

## 6. Email trigger flow (Resend)

```ts
async function changeTicketStage(ticketId: string, newStageId: string, agentId: string) {
  const ticket = await Ticket.findById(ticketId);
  const project = await Project.findById(ticket.projectId);
  const stage = project.stages.find(s => s.id === newStageId);

  ticket.currentStageId = newStageId;
  ticket.stageHistory.push({ stageId: newStageId, changedAt: new Date(), changedBy: agentId });
  await ticket.save();

  const statusUrl = `https://status.yoursupporthub.com/${ticket.statusToken}`;
  const rendered = renderTemplate(stage.emailTemplate, { ticket, project, statusUrl });

  await resend.emails.send({
    from: `${project.name} Support <support@yoursupporthub.com>`,
    to: ticket.requesterEmail,
    subject: rendered.subject,
    html: rendered.body,
  });
}
```

`renderTemplate` is a simple token replacer (`{{ticketNumber}}`, `{{stageName}}`,
`{{statusUrl}}`, `{{field.<id>}}`) — no need for a heavy templating engine at this scale.

## 7. File upload flow (Cloudinary)

1. Widget requests `POST /upload-signature` with `projectKey`.
2. API generates a short-lived signed payload (`timestamp`, `signature`, `folder: projectKey`)
   using the Cloudinary API secret — **the secret never leaves the server**.
3. Widget uploads directly to `https://api.cloudinary.com/v1_1/<cloud_name>/upload` with that
   signature.
4. Cloudinary returns a secure URL; widget includes it in the ticket submission payload.

This keeps large file bytes off your API server entirely — standard pattern for this stack.

## 8. Environment variables

```
# api/.env
MONGODB_URI=
JWT_SECRET=
RESEND_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CORS_DASHBOARD_ORIGIN=https://dashboard.yoursupporthub.com
STATUS_PAGE_BASE_URL=https://status.yoursupporthub.com
```

Never commit `.env`. Use `.env.example` with keys but no values, checked into git.

## 9. Security checklist specific to this build

- Rate-limit `POST /api/public/projects/:projectKey/tickets` per IP and per `projectKey`
  (spam/abuse is the main risk on a public, unauthenticated endpoint).
- Validate every `formResponses` payload against the project's **current** `formFields` schema
  server-side — never trust field names/types sent from the client, even though the widget
  renders them dynamically.
- `statusToken` and `projectSecret` must be generated with `crypto.randomBytes`, not `Math.random`.
- Sanitize any field value that gets interpolated into the email HTML template
  (basic HTML-escape) to prevent stored content from breaking email rendering.
- Cloudinary upload signatures must be short-lived (a few minutes) and scoped to a folder per
  project.

## 10. State management notes for the dashboard

- TanStack Query for all server data (tickets, projects) — gives you caching, refetch-on-focus,
  and optimistic updates for stage changes for free.
- Keep the "create/edit project" form fields + stages builder as local component state (an
  array of `FormFieldDefinition`/`StageDefinition` objects), only POST/PATCH on save — don't
  round-trip every keystroke to the API.
