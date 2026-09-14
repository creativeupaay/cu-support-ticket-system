# PRD — Centralized Support Ticket System

## 1. Problem statement

You build multiple MERN CRMs/dashboards for different projects. Each one accumulates support
tickets/bugs reported by end-users, but there's no single place to collect, triage, and respond
to them. This product is a **standalone multi-project support ticket hub**: create a project once,
get a `projectKey`, drop a script tag into the target app, and every ticket submitted there flows
into one central dashboard.

## 2. Goals (v1)

- Create unlimited "Projects" (one per client app), each with its own configurable intake form
  and ticket-stage pipeline.
- Embed a lightweight widget in any project via a single script tag.
- End-users submit tickets through a form whose **fields are configurable per project**
  (chosen from a fixed field-type catalog at project-creation time).
- Ticket lifecycle moves through **configurable stages** (also defined per project).
- On every stage change, the end-user receives an **email notification** (one-way — no reply
  needed from them in v1).
- End-users can check their ticket status via a link in that email — **no login required**.
- One central agent dashboard to view/manage tickets across all projects.

## 3. Non-goals (explicitly out of scope for v1)

- Two-way chat / live reply from the end-user (planned for a later version).
- Client/organization self-serve reselling & multi-org billing.
- SLA timers, auto-assignment, canned responses.
- Real-time (Socket.io) updates — v1 is request/response + email only.
- Multi-language templates.

Keeping these out of v1 is intentional — they layer cleanly on top of this schema later without
a rewrite.

## 4. Personas

| Persona | Description | Access |
|---|---|---|
| **Admin (you)** | Creates projects, configures form fields & stages, manages agents | Full dashboard access |
| **Agent** | Views assigned/all tickets, changes ticket stage | Dashboard access, scoped by project (future) |
| **End-user** | Submits a ticket via the embedded widget on the client's site | No login — widget + emailed status link only |

## 5. Core features

### 5.1 Project creation with configurable form
When creating a project, the admin:
1. Names the project and sets allowed domains (for CORS/origin security).
2. Picks fields from the **field-type catalog** to include on the public ticket form, in order:
   - Text
   - Email (always recommend as required — this is how the user gets notified)
   - Textarea (the "message"/description field)
   - Dropdown (custom options, e.g. "Issue type: Bug / Feature request / Question")
   - File/photo upload (screenshots)
   - Checkbox / Radio (custom options)
3. For each field: label, required/optional, placeholder, and options (for dropdown/radio).
4. System auto-generates the `projectKey` (public) and `projectSecret` (private, shown once).

### 5.2 Configurable ticket stages
When creating a project, the admin also defines the pipeline, e.g.:

`Open → In Review → In Progress → Resolved → Closed`

Per stage the admin sets:
- Name, display color
- Order (position in pipeline)
- Whether it's the **default** stage new tickets land in (usually the first)
- Whether it's a **terminal** stage (Resolved/Closed — used for reporting, not required for logic)
- The **email template** sent to the end-user when a ticket enters this stage (subject + body,
  with tokens like `{{ticketNumber}}`, `{{stageName}}`, `{{statusUrl}}`, and any custom field
  value like `{{field.name}}`)

Every project starts from a sensible default pipeline the admin can edit or replace.

### 5.3 Widget & ticket submission
- A script tag embedded in the client project renders a floating button/form.
- The form is generated dynamically from the project's field configuration — no hardcoded
  fields except that email is effectively required for status updates to work.
- On submit: ticket is created in `Open` (or the admin-marked default stage), a status
  token is generated, and the end-user immediately gets a "We received your ticket" email
  containing a link to their status page.

### 5.4 Stage changes & email notifications
- Agent changes a ticket's stage from the dashboard.
- System sends an email (via Resend) using that stage's configured template to the ticket's
  `requesterEmail`.
- Every change is recorded in `stageHistory` for audit/reporting.

### 5.5 End-user status page
- Public page at `/status/:statusToken` (no login) — shows current stage, a timeline of
  stage history, and the original submitted info. Read-only in v1 (no reply box).

### 5.6 Agent dashboard
- Login (email/password or magic link — implementer's choice, JWT session).
- Project switcher (since dashboard spans all projects).
- Ticket list per project: filter by stage, search by email/ticket number/field value.
- Ticket detail: view submitted fields (including uploaded photos), change stage, add an
  **internal note** (not emailed to the end-user — agent-only context).

## 6. Key user flows

**Flow A — Admin creates a project**
Admin → New project → name + domains → select form fields + configure → define stages +
email templates → Save → gets `projectKey` + embed snippet.

**Flow B — End-user submits a ticket**
End-user on client site → clicks widget button → fills dynamically-rendered form → submits →
sees confirmation → receives "ticket received" email with status link.

**Flow C — Agent resolves a ticket**
Agent opens dashboard → selects project → opens ticket → reviews fields/attachments → changes
stage to "Resolved" → end-user automatically emailed → end-user can click link to confirm on
status page.

## 7. Success criteria for v1

- A project can be created and embedded in a target app in under 5 minutes.
- Any combination of the 4 field types can be added/removed/reordered without code changes.
- Stage pipelines are fully data-driven — adding a new stage requires no deploy.
- Every stage transition reliably triggers exactly one email.
- Dashboard can handle tickets across at least a handful of concurrent projects without
  cross-project data leaking (tenant isolation is a hard requirement, not a nice-to-have).

## 8. Open items to revisit post-v1

- Two-way messaging (reply from end-user re-opens the ticket / adds a message).
- Reseller/org-level accounts for clients to see their own dashboard.
- SLA + auto-assignment rules.
