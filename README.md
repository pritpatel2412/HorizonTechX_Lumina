# Lumina Social Network - HorizonTechX Lumina

Lumina is a modern social network application built as a monorepo workspace. It features a React-based frontend client, a sandbox mockup client, a shared database layer, and a robust Express-based API server.

## Workspace Project Structure

The codebase is organized as a pnpm monorepo under the following workspace directories:

### Frontend and Sandbox Clients
* **artifacts/lumina**: The main user-facing React web application built with Vite, React Query, Tailwind CSS, and wouter.
* **artifacts/mockup-sandbox**: A sandbox playground and testing environment for mockup components.

### Backend API Server
* **artifacts/api-server**: An Express backend server built with TypeScript, esbuild, pino-http logger, and Drizzle ORM.

### Shared Libraries
* **lib/db**: Shared database library containing the schema definitions, migrations, and seeding scripts configured with Drizzle ORM.
* **lib/api-spec**: OpenAPI schema definitions outlining the API contracts.
* **lib/api-zod**: Shared Zod schemas for input validation on both the frontend and backend.
* **lib/api-client-react**: A React API client with hooks auto-generated via Orval from the OpenAPI specifications.

---

## Prerequisites

Before running the application, make sure you have installed:
* Node.js (v18 or newer recommended)
* pnpm (v9 or v10)
* A PostgreSQL database instance (or a serverless Neon database connection URL)

---

## Getting Started

### 1. Install Dependencies
Install all package dependencies in the workspace:
```bash
pnpm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory of the workspace. A template is shown below:
```env
# Database configuration
DATABASE_URL="your-postgresql-database-connection-string"

# JWT configuration
SESSION_SECRET="your-jwt-session-secret-key"

# Node environment
NODE_ENV="development"

# Port for API server
PORT=5000
```

### 3. Database Migration and Seeding
Deploy database schemas and seed the initial database state:
```bash
# Push schema changes to database
pnpm --filter @workspace/db db:push

# Build libraries and API server
pnpm run build
```
The database will automatically seed on the initial API server startup if it is empty.

### 4. Running the Development Servers
Start both the API server and the frontend client concurrently for local development:
```bash
pnpm dev
```
By default:
* The frontend client will run on http://localhost:5173
* The backend API server will run on http://localhost:5000
* Vite config is configured to proxy all `/api` requests to http://localhost:5000 in development mode.

---

## Production Deployment on Vercel

The project is configured to deploy as a unified monorepo on Vercel.

### Vercel Routing Configuration
* Root-level `vercel.json` rewrites requests prefixed with `/api/*` to the serverless function `/api/index.mjs` (mapped as `/api/index`), and all other requests (`/*`) to the built frontend `index.html`.
* This setup allows the frontend client to call `/api/*` using relative paths on the same domain, eliminating CORS configuration issues.

### Vercel Build Settings
* **Build Command**: `pnpm run vercel-build` (which triggers typechecks and workspace builds)
* **Output Directory**: `artifacts/lumina/dist/public`
* **Root Directory**: Repository root directory
