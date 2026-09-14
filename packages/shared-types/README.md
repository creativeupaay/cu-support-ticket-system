# Shared Types Package (`packages/shared-types`)

Single source of truth for TypeScript types, Zod schemas, template token substitution, and dynamic form response validators used by `api`, `dashboard`, and `widget`.

## Field-Type Catalog

| Field Type | Description | Options Required? |
|---|---|---|
| `text` | Single-line text input | No |
| `email` | Validated email address | No |
| `textarea` | Multi-line text field | No |
| `dropdown` | Single-choice `<select>` menu | Yes (`options: string[]`) |
| `radio` | Single-choice radio group | Yes (`options: string[]`) |
| `checkbox` | Boolean or multi-select checkbox | Optional |
| `file` | Direct-to-cloud file or screenshot upload | No |

## Email Template Token Catalog

When customizing stage transition emails in the StageBuilder, the following tokens are dynamically replaced:

| Token | Description | Example Output |
|---|---|---|
| `{{ticketNumber}}` | Auto-generated sequential ticket number | `ACME-1001` |
| `{{stageName}}` | Name of the stage the ticket transitioned into | `In Progress` |
| `{{statusUrl}}` | Unauthenticated public URL to check ticket timeline | `http://localhost:5173/status/abc...` |
| `{{project.name}}` | Display name of the project | `Acme Cloud Platform` |
| `{{requesterEmail}}` | Requester email address | `user@example.com` |
| `{{field.<fieldId>}}` | Value of any submitted form field (e.g. `{{field.description}}`) | `The export button failed...` |

> [!NOTE]
> All user-supplied field values interpolated into HTML email templates are automatically HTML-escaped to prevent stored XSS attacks.
