# SupportHub API (`apps/api`)

Production-ready Express + TypeScript + Mongoose backend service for the Centralized Support Ticket System.

## Features

- **Multi-Tenant Architecture**: Strict isolation on all database lookups scoped by `organizationId` (agents) and `projectId` (public).
- **JWT Agent Auth**: Secure login via bcrypt password hashing and JSON Web Tokens.
- **Dynamic Form Validation**: Zod runtime schema generation against each project's custom `formFields`.
- **Public API v1**: Versioned endpoints (`/api/public/v1/...`) with origin-check allowlists and rate limiting.
- **Transactional Notifications**: Stage change triggers sending formatted emails via Resend (with dev fallback logger).
- **Direct Browser Uploads**: Cloudinary signed payloads keeping heavy file bytes off the API server.
- **In-Memory Mongo Fallback**: Automatically spins up `mongodb-memory-server` if no external database is connected.

## Environment Variables (`.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | API listen port | `5001` |
| `MONGODB_URI` | MongoDB Connection URI (optional in dev) | `mongodb://localhost:27017/support_hub` |
| `JWT_SECRET` | Secret for signing JWTs | `super_secret_jwt_key_here` |
| `RESEND_API_KEY` | Resend API key (optional in dev) | `re_123456789` |
| `EMAIL_FROM` | Sender address | `Support Hub <support@resend.dev>` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `demo_cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `1234567890` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `secret_abcdef` |
| `STATUS_PAGE_BASE_URL` | Base URL for generated status links | `http://localhost:5173/status` |
| `CORS_DASHBOARD_ORIGIN` | Allowed dashboard origin | `http://localhost:5173` |

## Local Development

```bash
# Start API dev server (with hot reload via tsx)
npm run dev -w apps/api

# Build TypeScript to dist
npm run build -w apps/api

# Run integration tests
npm run test -w apps/api
```

## Default Seeded Admin Credentials

On first launch, if the database has no agents, it auto-seeds:
- **Email**: `admin@supporthub.com`
- **Password**: `admin123456`
- **Demo Project**: `Acme Cloud Platform` (`proj_demo_live`)
