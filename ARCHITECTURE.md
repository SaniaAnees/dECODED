# decodedd Architecture

## Product Blueprint

- **App Name:** decodedd
- **Product:** Local-First AI Orchestrator & Context Proxy Engine
- **UI Design:** Gemini-style dark-mode canvas (`#131314`) with a collapsible sidebar.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Web application | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres) |
| Database ORM | Drizzle ORM |
| Authentication | NextAuth with Google Auth |
| Hosting and deployment | Vercel |
| Source control | GitHub |

## Repository Layout

```text
decodedd/
├── web/          # Next.js UI and API proxy
└── cli-proxy/    # Local daemon
```

### `web/`

The browser-facing Next.js application. It provides the Gemini-inspired interface, authentication, persistent application data, and API proxy routes.

### `cli-proxy/`

The local daemon responsible for local-first orchestration and context proxying between local resources and the web application.

## Design Principles

- Keep local context under the user's control whenever possible.
- Use the web layer for user experience, authentication, and remotely hosted services.
- Keep the UI focused, spacious, and consistent with the Gemini-style dark canvas.
