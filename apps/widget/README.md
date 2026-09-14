# SupportHub Embeddable Widget (`apps/widget`)

Lightweight, isolated customer support widget embeddable into any third-party web application via a single `<script>` tag.

## Architecture

1. **Vanilla Loader Script (`public/widget.js`)**:
   - Ultra-lightweight footprint (< 3KB).
   - Injects floating launcher button with support icon at bottom-right corner.
   - Embeds and toggles an isolated `<iframe>` containing the React form application.
2. **Iframe React Application**:
   - Sandboxed inside an iframe so Tailwind CSS rules never collide with host sites.
   - Loads dynamic fields according to the project's schema (`/api/public/v1/projects/:projectKey/schema`).
   - Supports text, email, textarea, dropdown, radio, checkbox, and direct Cloudinary file/photo uploads.
   - Shows confirmation screen with ticket reference number upon submission.

## Host Embedding Example

```html
<!-- In client application HTML -->
<script src="http://localhost:5174/widget.js" data-project-key="proj_demo_live" async></script>
```

## Running Locally

```bash
# Start Widget Vite server on port 5174
npm run dev -w apps/widget

# Build widget
npm run build -w apps/widget
```
