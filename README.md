# Centralized Support Ticket System (SupportHub)

A standalone, multi-project support ticket hub built for modern client web applications.

Create a project once, define custom intake form fields and stage pipelines, drop a single `<script>` tag into any target web app, and manage incoming tickets across all client projects from a centralized agent dashboard.

---

## Repository Monorepo Structure

```
support-ticket-system/
├── packages/
│   └── shared-types/           # Zod schemas, data contracts, and template renderers
├── apps/
│   ├── api/                    # Express + TS + Mongoose multi-tenant backend (Port 5001)
│   ├── dashboard/              # React + Vite + Tailwind + TanStack Query agent portal (Port 5173)
│   └── widget/                 # Embeddable vanilla loader + React iframe intake form (Port 5174)
├── demo/
│   └── index.html              # Demo client host site showcasing the embedded widget
├── 01-PRD.md                   # Product requirements document
├── 02-TECHNICAL-IMPLEMENTATION.md # Technical specification
├── 03-DESIGN-SYSTEM.md         # Tailwind tokens & visual principles
└── 04-ENGINEERING-GUIDELINES.md# Engineering conventions
```

---

## Quick Start

### 1. Install Monorepo Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` in `apps/api/`:
```bash
cp apps/api/.env.example apps/api/.env
```
*(Leave `MONGODB_URI` empty to use the automatic embedded in-memory MongoDB instance for local dev).*

### 3. Build All Workspaces

```bash
npm run build
```

### 4. Run Test Suites

```bash
npm run test
```

### 5. Start Development Servers

```bash
# Start all 3 services concurrently
npm run dev

# Or start services individually:
npm run dev:api         # API on http://localhost:5001
npm run dev:dashboard   # Dashboard on http://localhost:5173
npm run dev:widget      # Widget on http://localhost:5174
```

---

## Default Seeded Admin Credentials

When the API server starts with an empty database, it automatically seeds:
- **Email**: `admin@supporthub.com`
- **Password**: `admin123456`
- **Sample Project**: `Acme Cloud Platform` (`proj_demo_live`)

---

## Embedding the Widget in Any Client App

Drop this script tag into any HTML document:

```html
<script src="http://localhost:5174/widget.js" data-project-key="proj_demo_live" async></script>
```

You can open `demo/index.html` in your browser to see a live client application utilizing this embedded script tag.
