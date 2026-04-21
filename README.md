# Bookclub

A simple book sharing app for friends. Built to experiment with a modern full-stack TypeScript setup without reaching for a large framework.

## What it does

- Log in with email and password
- See books and reviews added by everyone in the group
- Add books you have read with a rating (1–5) and an optional review

## Tech stack

**Frontend**
- React + Vite
- TanStack Router
- TanStack Query
- better-auth (client)

**Backend**
- Hono
- Prisma 7
- better-auth
- Neon (PostgreSQL)

## Status

Work in progress. Core auth and book listing is working. Adding and editing books from the UI is not yet built.

## Running locally

**Backend**

```bash
cd backend
npm install
npm run dev
```

Requires a `.env` file:

```
DATABASE_URL=...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Requires a `.env` file:

```
VITE_API_URL=http://localhost:3000
```
