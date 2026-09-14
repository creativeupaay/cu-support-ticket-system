# SupportHub Agent Dashboard (`apps/dashboard`)

Data-dense, high-efficiency internal management tool for agents to triage support tickets across multiple projects.

## Stack & Architecture

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS with custom design tokens from `03-DESIGN-SYSTEM.md`
- **State Management**: TanStack Query v5 with optimistic updates and background refetching
- **Icons**: Lucide React

## Features

- **Multi-Project Switcher**: Seamlessly switch between client projects from the global topbar.
- **Visual Field & Stage Builders**: Customize dynamic forms and stage pipelines (with preset color swatches and email template editors).
- **Interactive Ticket Inbox**: Filter by pipeline stage, search across ticket numbers, requester emails, and notes.
- **Inline Stage Transition**: Instantly update ticket stages directly from the ticket view without interrupting modal dialogs.
- **Private Internal Notes**: Record private context visible only to internal agents.
- **Public End-user Status Page**: Unauthenticated route at `/status/:statusToken` displaying a live vertical stage timeline and submitted values.

## Running Locally

```bash
# Start Vite development server on port 5173
npm run dev -w apps/dashboard

# Production build
npm run build -w apps/dashboard
```
